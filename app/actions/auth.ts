"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect("/");
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const codigo = String(formData.get("codigo") ?? "").trim();

  if (!email || !password || !codigo) {
    return { error: "Completa correo, contraseña y código de invitación." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
    {
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm?next=/onboarding`,
      },
    },
  );

  if (signUpError) {
    return { error: traducirErrorSignUp(signUpError.message) };
  }

  // Si la confirmación de correo está activada en Supabase, todavía no
  // hay sesión: no podemos ejecutar join_box (requiere auth.uid()). El
  // enlace del correo pasa por /auth/confirm, que sí abre sesión, así
  // que aquí solo falta que la persona use su código de invitación.
  if (!signUpData.session) {
    return {
      success: true,
      message:
        "Cuenta creada. Revisa tu correo y confirma tu cuenta: al hacerlo quedarás con sesión iniciada y solo tendrás que ingresar tu código de invitación.",
    };
  }

  const { error: joinError } = await supabase.rpc("join_box", {
    p_codigo: codigo,
  });

  if (joinError) {
    return {
      success: true,
      message: `Tu cuenta fue creada, pero no pudimos unirte al box: ${joinError.message}. Inicia sesión y vuelve a intentarlo.`,
    };
  }

  redirect("/");
}

export async function joinBoxAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const codigo = String(formData.get("codigo") ?? "").trim();

  if (!codigo) {
    return { error: "Ingresa el código de invitación." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_box", {
    p_codigo: codigo,
  });

  if (error) {
    return { error: traducirErrorJoinBox(error.message) };
  }

  redirect("/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Ingresa tu correo." };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/restablecer-password`,
  });

  if (error) {
    return { error: "No pudimos enviar el correo. Intenta de nuevo." };
  }

  return {
    success: true,
    message:
      "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.",
  };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "El enlace expiró o ya se usó. Solicita uno nuevo.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "No pudimos actualizar tu contraseña. Intenta de nuevo." };
  }

  redirect("/dashboard");
}

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) {
    return origin;
  }
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

function traducirErrorSignUp(message: string) {
  if (message.toLowerCase().includes("already registered")) {
    return "Ya existe una cuenta con ese correo.";
  }
  return message;
}

function traducirErrorJoinBox(message: string) {
  if (message.includes("Código de invitación inválido")) {
    return "El código de invitación no existe. Verifícalo con tu coach.";
  }
  if (message.includes("Ya eres miembro")) {
    return "Ya eres miembro de este box.";
  }
  if (message.includes("Rol inválido")) {
    return "Selecciona un rol válido.";
  }
  return message;
}
