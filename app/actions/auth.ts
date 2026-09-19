"use server";

import { redirect } from "next/navigation";
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
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
    { email, password },
  );

  if (signUpError) {
    return { error: traducirErrorSignUp(signUpError.message) };
  }

  // Si la confirmación de correo está activada en Supabase, todavía no
  // hay sesión: no podemos ejecutar join_box (requiere auth.uid()).
  if (!signUpData.session) {
    return {
      success: true,
      message:
        "Cuenta creada. Revisa tu correo para confirmar tu cuenta. Luego inicia sesión y usa el código de invitación para unirte a tu box.",
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

  redirect("/dashboard");
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
  const { error } = await supabase.rpc("join_box", { p_codigo: codigo });

  if (error) {
    return { error: traducirErrorJoinBox(error.message) };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
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
  return message;
}
