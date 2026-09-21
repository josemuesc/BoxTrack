"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { enviarPushAUsuario } from "@/lib/push";

const TIPO_CORAZON = "corazon";

export async function toggleReaccionAction(logroId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
  }

  const { data: existente } = await supabase
    .from("reacciones")
    .select("id")
    .eq("logro_id", logroId)
    .eq("usuario_id", user.id)
    .eq("tipo", TIPO_CORAZON)
    .maybeSingle();

  if (existente) {
    await supabase.from("reacciones").delete().eq("id", existente.id);
  } else {
    await supabase.from("reacciones").insert({
      logro_id: logroId,
      usuario_id: user.id,
      tipo: TIPO_CORAZON,
    });
    await notificarReaccion(supabase, logroId, user.id);
  }

  revalidatePath("/logros");
  return {};
}

// Best-effort: si el push falla no se bloquea la reacción, que ya quedó
// guardada correctamente.
async function notificarReaccion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  logroId: string,
  usuarioReaccionaId: string,
) {
  try {
    const { data: logro } = await supabase
      .from("logros")
      .select(
        "usuario_id, registro_rm:registros_rm(movimiento:movimientos(nombre))",
      )
      .eq("id", logroId)
      .maybeSingle<{
        usuario_id: string;
        registro_rm: { movimiento: { nombre: string } | null } | null;
      }>();

    if (!logro || logro.usuario_id === usuarioReaccionaId) return;

    const { data: perfilReacciona } = await supabase
      .from("perfiles")
      .select("nombre")
      .eq("usuario_id", usuarioReaccionaId)
      .maybeSingle();

    const nombreReacciona = perfilReacciona?.nombre || "Alguien";
    const movimiento = logro.registro_rm?.movimiento?.nombre;

    await enviarPushAUsuario(logro.usuario_id, {
      title: "❤️ ¡Te felicitaron!",
      body: movimiento
        ? `${nombreReacciona} reaccionó a tu PR en ${movimiento}.`
        : `${nombreReacciona} reaccionó a tu PR.`,
      url: `/logros#logro-${logroId}`,
      tag: `reaccion-${logroId}`,
    });
  } catch {
    // Ignorar: la reacción ya quedó guardada.
  }
}
