import type { SupabaseClient } from "@supabase/supabase-js";

export type CoachBox = {
  boxId: string;
  boxNombre: string;
};

type MembresiaConBox = {
  box_id: string;
  box: { nombre: string } | null;
};

export async function getCoachBox(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<CoachBox | null> {
  const { data } = await supabase
    .from("membresias")
    .select("box_id, box:boxes(nombre)")
    .eq("usuario_id", usuarioId)
    .eq("rol", "coach")
    .limit(1)
    .maybeSingle();

  const membresia = data as unknown as MembresiaConBox | null;

  if (!membresia?.box) {
    return null;
  }

  return { boxId: membresia.box_id, boxNombre: membresia.box.nombre };
}
