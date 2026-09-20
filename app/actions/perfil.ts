"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PerfilActionState = {
  error?: string;
};

export async function completarPerfilAction(
  _prevState: PerfilActionState,
  formData: FormData,
): Promise<PerfilActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const alturaRaw = String(formData.get("altura_cm") ?? "").trim();

  if (!nombre) {
    return { error: "Ingresa tu nombre." };
  }

  let alturaCm: number | null = null;
  if (alturaRaw) {
    const valor = Number(alturaRaw);
    if (Number.isNaN(valor) || valor <= 0) {
      return { error: "Ingresa una altura válida en cm." };
    }
    alturaCm = valor;
  }

  const { error } = await supabase.from("perfiles").upsert(
    {
      usuario_id: user.id,
      nombre,
      altura_cm: alturaCm,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "usuario_id" },
  );

  if (error) {
    return { error: `No se pudo guardar tu perfil: ${error.message}` };
  }

  redirect("/dashboard");
}
