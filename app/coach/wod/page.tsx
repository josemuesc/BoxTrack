import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCoachBox } from "@/lib/coach";
import { fechaHoyBox } from "@/lib/fecha";

type Movimiento = {
  nombre: string;
  reps: string;
  peso_kg: number | null;
  porcentaje_rm: number | null;
};

type Wod = {
  id: string;
  nombre: string;
  formato: string;
  movimientos: Movimiento[];
};

const FORMATO_LABEL: Record<string, string> = {
  for_time: "Por tiempo",
  amrap: "AMRAP",
  emom: "EMOM",
  max_weight: "Peso máximo",
  otro: "Otro",
};

export default async function CoachWodPage() {
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

  const hoy = fechaHoyBox();

  const { data: wodOficial } = await supabase
    .from("wods")
    .select("id, nombre, formato, movimientos")
    .eq("box_id", coachBox.boxId)
    .eq("origen", "oficial_coach")
    .eq("fecha_creacion", hoy)
    .limit(1)
    .maybeSingle<Wod>();

  let totalRegistrados = 0;
  if (wodOficial) {
    const { count } = await supabase
      .from("resultados")
      .select("id", { count: "exact", head: true })
      .eq("wod_id", wodOficial.id);
    totalRegistrados = count ?? 0;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/coach"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold text-foreground">WOD de hoy</h1>
      </div>

      {wodOficial ? (
        <section className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6">
          <p className="text-sm font-medium text-accent">
            WOD oficial de {coachBox.boxNombre}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">
            {wodOficial.nombre}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {FORMATO_LABEL[wodOficial.formato] ?? wodOficial.formato}
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {wodOficial.movimientos.map((m, i) => (
              <li
                key={i}
                className="rounded-lg bg-black/30 px-3.5 py-2.5 text-sm text-foreground"
              >
                <span className="font-semibold">{m.reps}</span> {m.nombre}
                {m.peso_kg ? ` · ${m.peso_kg} kg` : ""}
                {m.porcentaje_rm ? ` · ${m.porcentaje_rm}% RM` : ""}
              </li>
            ))}
          </ul>

          <Link
            href={`/coach/wod/${wodOficial.id}/resultados`}
            className="mt-5 flex items-center justify-between gap-2 rounded-xl bg-black/30 px-3.5 py-3 text-sm font-semibold text-foreground transition-colors active:bg-black/40"
          >
            <span>
              {totalRegistrados} atleta{totalRegistrados === 1 ? "" : "s"}{" "}
              {totalRegistrados === 1 ? "ha" : "han"} registrado su
              resultado.
            </span>
            <span className="text-muted">→</span>
          </Link>
        </section>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">
            Todavía no subes el WOD oficial de hoy para tu box.
          </p>
          <Link
            href="/coach/wod/nueva-foto"
            className="rounded-2xl bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20"
          >
            📷 Subir WOD de hoy
          </Link>
        </div>
      )}
    </main>
  );
}
