import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export default async function WodPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membresia } = await supabase
    .from("membresias")
    .select("box_id, rol")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membresia) {
    redirect("/onboarding");
  }

  if (membresia.rol === "coach") {
    redirect("/coach/wod");
  }

  const boxId = membresia.box_id;
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: wodOficial } = await supabase
    .from("wods")
    .select("id, nombre, formato, movimientos")
    .eq("box_id", boxId)
    .eq("origen", "oficial_coach")
    .eq("fecha_creacion", hoy)
    .limit(1)
    .maybeSingle<Wod>();

  let yaRegistrado = false;
  if (wodOficial) {
    const { data: resultado } = await supabase
      .from("resultados")
      .select("id")
      .eq("wod_id", wodOficial.id)
      .eq("usuario_id", user.id)
      .limit(1)
      .maybeSingle();
    yaRegistrado = Boolean(resultado);
  }

  const { data: personalesHoy } = await supabase
    .from("wods")
    .select("id, nombre, formato, movimientos")
    .eq("box_id", boxId)
    .eq("origen", "personal_atleta")
    .eq("creado_por", user.id)
    .eq("fecha_creacion", hoy)
    .order("creado_en", { ascending: false })
    .returns<Wod[]>();

  const personales = personalesHoy ?? [];
  let personalesConResultado = new Set<string>();
  if (personales.length > 0) {
    const { data: resultadosPersonales } = await supabase
      .from("resultados")
      .select("wod_id")
      .eq("usuario_id", user.id)
      .in(
        "wod_id",
        personales.map((w) => w.id),
      );
    personalesConResultado = new Set(
      (resultadosPersonales ?? []).map((r) => r.wod_id),
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <h1 className="flex-1 text-xl font-bold text-foreground">
          WOD de hoy
        </h1>
        <Link
          href="/wod/guardados"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground"
        >
          ⭐ Guardados
        </Link>
      </div>

      {wodOficial ? (
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6">
            <p className="text-sm font-medium text-accent">
              WOD oficial del box
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
          </section>

          {yaRegistrado ? (
            <p className="rounded-2xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
              Ya registraste tu resultado de hoy para este WOD.
            </p>
          ) : (
            <Link
              href={`/wod/${wodOficial.id}/resultado`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-center text-base font-bold text-accent-foreground shadow-lg shadow-accent/20"
            >
              Registrar resultado
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">
            Tu coach todavía no subió el WOD oficial de hoy. Puedes tomarle
            una foto al tuyo y registrarlo como personal.
          </p>
          <Link
            href="/wod/nueva-foto"
            className="rounded-2xl bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20"
          >
            📷 Tomar foto de mi WOD
          </Link>
        </div>
      )}

      <section className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
            Otros entrenos de hoy
          </h2>
          <Link
            href="/wod/nueva-foto"
            className="text-sm font-semibold text-accent"
          >
            + Agregar
          </Link>
        </div>

        {personales.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-5 text-center text-sm text-muted">
            ¿Hiciste otro entreno además del WOD de hoy? Tómale una foto y
            regístralo como personal.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {personales.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {w.nombre}
                  </p>
                  <p className="text-xs text-muted">
                    {FORMATO_LABEL[w.formato] ?? w.formato} · Personal
                  </p>
                </div>
                {personalesConResultado.has(w.id) ? (
                  <span className="text-xs font-semibold text-muted">
                    Registrado
                  </span>
                ) : (
                  <Link
                    href={`/wod/${w.id}/resultado`}
                    className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"
                  >
                    Registrar
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
