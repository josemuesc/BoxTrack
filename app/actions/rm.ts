"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { enviarPushABox } from "@/lib/push";

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
  const pesoCorporalRaw = String(
    formData.get("peso_corporal_kg") ?? "",
  ).trim();

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

  let pesoCorporal: number | null = null;
  if (pesoCorporalRaw) {
    const valor = Number(pesoCorporalRaw);
    if (Number.isNaN(valor) || valor <= 0) {
      return { error: "Ingresa un peso corporal válido." };
    }
    pesoCorporal = valor;
  }

  // Se consulta el máximo previo ANTES de insertar para saber si este
  // registro es un nuevo PR (o el primero) de este movimiento.
  const { data: previo } = await supabase
    .from("registros_rm")
    .select("peso_kg")
    .eq("usuario_id", user.id)
    .eq("movimiento_id", movimientoId)
    .order("peso_kg", { ascending: false })
    .limit(1)
    .maybeSingle();

  const esPr = !previo || peso > previo.peso_kg;

  const { data: nuevoRegistro, error } = await supabase
    .from("registros_rm")
    .insert({
      usuario_id: user.id,
      box_id: boxId,
      movimiento_id: movimientoId,
      peso_kg: peso,
      fecha,
      notas: notasRaw || null,
    })
    .select("id")
    .single();

  if (error || !nuevoRegistro) {
    return {
      error: `No se pudo guardar el registro: ${error?.message ?? "error desconocido"}`,
    };
  }

  // Best-effort: si algo falla aquí no se bloquea el guardado del RM,
  // que ya quedó registrado correctamente.
  if (esPr) {
    const { data: nuevoLogro } = await supabase
      .from("logros")
      .insert({
        usuario_id: user.id,
        box_id: boxId,
        registro_rm_id: nuevoRegistro.id,
        tipo: "pr_movimiento",
        fecha,
      })
      .select("id")
      .single();

    if (nuevoLogro) {
      try {
        const [{ data: perfil }, { data: movimiento }] = await Promise.all([
          supabase
            .from("perfiles")
            .select("nombre")
            .eq("usuario_id", user.id)
            .maybeSingle(),
          supabase
            .from("movimientos")
            .select("nombre")
            .eq("id", movimientoId)
            .maybeSingle(),
        ]);

        const nombreAtleta = perfil?.nombre || "Un atleta";
        const nombreMovimiento = movimiento?.nombre ?? "un movimiento";

        await enviarPushABox(
          boxId,
          {
            title: "🎉 ¡Nuevo PR en el box!",
            body: `${nombreAtleta} rompió su PR en ${nombreMovimiento}: ${peso} kg. ¡Felicítalo!`,
            url: `/logros#logro-${nuevoLogro.id}`,
            tag: `pr-${nuevoLogro.id}`,
          },
          user.id,
        );
      } catch {
        // Ignorar: el PR ya quedó registrado.
      }
    }
  }

  if (pesoCorporal !== null) {
    await supabase.from("registros_peso").upsert(
      {
        usuario_id: user.id,
        box_id: boxId,
        peso_kg: pesoCorporal,
        fecha,
      },
      { onConflict: "usuario_id,fecha" },
    );
  }

  revalidatePath("/progreso");
  redirect("/progreso");
}
