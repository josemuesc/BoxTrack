import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCoachBox } from "@/lib/coach";
import WodFotoForm from "@/components/wod-foto-form";

export default async function CoachNuevaFotoWodPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const coachBox = await getCoachBox(supabase, user.id);
  if (!coachBox) {
    redirect("/dashboard");
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const { data: wodOficial } = await supabase
    .from("wods")
    .select("id")
    .eq("box_id", coachBox.boxId)
    .eq("origen", "oficial_coach")
    .eq("fecha_creacion", hoy)
    .limit(1)
    .maybeSingle();

  if (wodOficial) {
    redirect("/coach/wod");
  }

  const { data: movimientos } = await supabase
    .from("movimientos")
    .select("id, nombre")
    .order("nombre");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/coach/wod"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold text-foreground">
          Subir WOD de hoy
        </h1>
      </div>

      <WodFotoForm
        boxId={coachBox.boxId}
        origen="oficial_coach"
        movimientosCatalogo={movimientos ?? []}
      />
    </main>
  );
}
