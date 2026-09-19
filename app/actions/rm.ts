"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RmActionState = {
  error?: string;
};

export async function createRmAction(
  _prevState: RmActionState,
  formData: FormData,
): Promise<RmActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const boxId = String(formData.get("box_id") ?? "");
  const movimientoId = String(formData.get("movimiento_id") ?? "");
  const pesoRaw = String(formData.get("peso_kg") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const notasRaw = String(formData.get("notas") ?? "").trim();

  if (!boxId || !movimientoId) {
    return { error: "Selecciona un movimiento." };
  }

  const peso = Number(pesoRaw);
  if (!pesoRaw || Number.isNaN(peso) || peso <= 0) {
    return { error: "Ingresa un peso válido en kg." };
  }

  if (!fecha) {
    return { error: "Selecciona una fecha." };
  }

  const { error } = await supabase.from("registros_rm").insert({
    usuario_id: user.id,
    box_id: boxId,
    movimiento_id: movimientoId,
    peso_kg: peso,
    fecha,
    notas: notasRaw || null,
  });

  if (error) {
    return { error: `No se pudo guardar el registro: ${error.message}` };
  }

  revalidatePath("/progreso");
  redirect("/progreso");
}
