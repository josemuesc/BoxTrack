import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResultadoForm from "./resultado-form";

type Movimiento = {
  nombre: string;
  reps: string;
  peso_kg: number | null;
  porcentaje_rm: number | null;
};

const FORMATO_LABEL: Record<string, string> = {
  for_time: "Por tiempo",
  amrap: "AMRAP",
  emom: "EMOM",
  max_weight: "Peso máximo",
  otro: "Otro",
};

export default async function RegistrarResultadoPage({
  params,
}: {
  params: Promise<{ wodId: string }>;
}) {
  const { wodId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membresia } = await supabase
    .from("membresias")
    .select("box_id")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membresia) {
    redirect("/onboarding");
  }

  const { data: wod } = await supabase
    .from("wods")
    .select("id, nombre, formato, movimientos, box_id")
    .eq("id", wodId)
    .maybeSingle<{
      id: string;
      nombre: string;
      formato: string;
      movimientos: Movimiento[];
      box_id: string;
    }>();

  if (!wod) {
    notFound();
  }

  const { data: guardado } = await supabase
    .from("guardados")
    .select("id")
    .eq("wod_id", wodId)
    .eq("usuario_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/wod"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold text-foreground">
          Registrar resultado
        </h1>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-black text-foreground">{wod.nombre}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {FORMATO_LABEL[wod.formato] ?? wod.formato}
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {wod.movimientos.map((m, i) => (
            <li key={i} className="text-sm text-foreground">
              <span className="font-semibold">{m.reps}</span> {m.nombre}
              {m.peso_kg ? ` · ${m.peso_kg} kg` : ""}
              {m.porcentaje_rm ? ` · ${m.porcentaje_rm}% RM` : ""}
            </li>
          ))}
        </ul>
      </section>

      <ResultadoForm
        wodId={wod.id}
        boxId={wod.box_id}
        formato={wod.formato}
        guardadoInicialId={guardado?.id ?? null}
      />
    </main>
  );
}
