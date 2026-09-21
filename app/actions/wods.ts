"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extraerWodDeImagen, type WodExtraido } from "@/lib/anthropic";
import { enviarPushABox } from "@/lib/push";

export type ExtraerWodResult = { data: WodExtraido } | { error: string };

export async function extraerWodDesdeFotoAction(params: {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<ExtraerWodResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return extraerWodDeImagen(params);
}

export type MovimientoWodInput = {
  nombre: string;
  movimiento_id: string | null;
  reps: string;
  peso_kg: number | null;
  porcentaje_rm: number | null;
};

export type GuardarWodInput = {
  boxId: string;
  origen: "oficial_coach" | "personal_atleta";
  nombre: string;
  formato: "for_time" | "amrap" | "emom" | "max_weight" | "otro";
  movimientos: MovimientoWodInput[];
};

export type GuardarWodResult = { error: string } | { wodId: string };

export async function guardarWodAction(
  input: GuardarWodInput,
): Promise<GuardarWodResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nombre = input.nombre.trim();
  if (!nombre) {
    return { error: "El WOD necesita un nombre." };
  }

  const movimientos = input.movimientos
    .map((m) => ({ ...m, nombre: m.nombre.trim() }))
    .filter((m) => m.nombre);

  if (movimientos.length === 0) {
    return { error: "Agrega al menos un movimiento." };
  }

  const { data: nuevoWod, error } = await supabase
    .from("wods")
    .insert({
      creado_por: user.id,
      box_id: input.boxId,
      nombre,
      formato: input.formato,
      movimientos,
      origen: input.origen,
    })
    .select("id")
    .single();

  if (error || !nuevoWod) {
    if (error?.code === "23505") {
      return {
        error:
          "Ya existe un WOD oficial para hoy en este box. Actualiza la página.",
      };
    }
    return {
      error: `No se pudo guardar el WOD: ${error?.message ?? "error desconocido"}`,
    };
  }

  revalidatePath("/wod");
  revalidatePath("/coach/wod");

  if (input.origen === "oficial_coach") {
    // Best-effort: si el push falla no se bloquea el guardado del WOD,
    // que ya quedó registrado correctamente. Se espera (await) porque en
    // un entorno serverless una promesa sin await puede cancelarse antes
    // de terminar cuando la función responde.
    try {
      await enviarPushABox(
        input.boxId,
        {
          title: "🏋️ Nuevo WOD del día",
          body: nombre,
          url: "/wod",
          tag: "wod-oficial",
        },
        user.id,
      );
    } catch {
      // Ignorar: el WOD ya quedó guardado.
    }
  }

  return { wodId: nuevoWod.id as string };
}

export type ResultadoActionState = {
  error?: string;
};

export async function crearResultadoAction(
  _prevState: ResultadoActionState,
  formData: FormData,
): Promise<ResultadoActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const wodId = String(formData.get("wod_id") ?? "");
  const boxId = String(formData.get("box_id") ?? "");
  const formato = String(formData.get("formato") ?? "");
  const guardar = formData.get("guardar") === "on";

  if (!wodId || !boxId) {
    return { error: "WOD inválido." };
  }

  let resultado: Record<string, unknown>;

  if (formato === "for_time") {
    const minutos = Number(formData.get("minutos") ?? "");
    const segundosParte = Number(formData.get("segundos_parte") ?? "");
    if (
      Number.isNaN(minutos) ||
      Number.isNaN(segundosParte) ||
      minutos < 0 ||
      segundosParte < 0 ||
      segundosParte > 59
    ) {
      return { error: "Ingresa un tiempo válido (mm:ss)." };
    }
    resultado = { tipo: "tiempo", segundos: minutos * 60 + segundosParte };
  } else if (formato === "amrap" || formato === "emom") {
    const rondas = Number(formData.get("rondas") ?? "");
    const repsExtra = Number(formData.get("reps_extra") ?? "0");
    if (Number.isNaN(rondas) || rondas < 0) {
      return { error: "Ingresa un número de rondas válido." };
    }
    resultado = {
      tipo: "rounds_reps",
      rondas,
      reps: Number.isNaN(repsExtra) ? 0 : repsExtra,
    };
  } else if (formato === "max_weight") {
    const pesoKg = Number(formData.get("peso_kg") ?? "");
    if (Number.isNaN(pesoKg) || pesoKg <= 0) {
      return { error: "Ingresa un peso válido en kg." };
    }
    resultado = { tipo: "peso", peso_kg: pesoKg };
  } else {
    const texto = String(formData.get("texto") ?? "").trim();
    if (!texto) {
      return { error: "Describe tu resultado." };
    }
    resultado = { tipo: "texto", texto };
  }

  const { data: nuevoResultado, error } = await supabase
    .from("resultados")
    .insert({
      wod_id: wodId,
      usuario_id: user.id,
      box_id: boxId,
      resultado,
    })
    .select("id")
    .single();

  if (error || !nuevoResultado) {
    return {
      error: `No se pudo guardar el resultado: ${error?.message ?? "error desconocido"}`,
    };
  }

  if (guardar) {
    await supabase.from("guardados").upsert(
      {
        wod_id: wodId,
        usuario_id: user.id,
      },
      { onConflict: "wod_id,usuario_id" },
    );
  }

  revalidatePath("/wod");
  redirect("/wod");
}

export async function eliminarGuardadoAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const guardadoId = String(formData.get("guardado_id") ?? "");
  if (!guardadoId) return;

  await supabase
    .from("guardados")
    .delete()
    .eq("id", guardadoId)
    .eq("usuario_id", user.id);

  revalidatePath("/wod/guardados");
}
