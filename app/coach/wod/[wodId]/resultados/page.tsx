import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCoachBox } from "@/lib/coach";

const FORMATO_LABEL: Record<string, string> = {
  for_time: "Por tiempo",
  amrap: "AMRAP",
  emom: "EMOM",
  max_weight: "Peso máximo",
  otro: "Otro",
};

type Resultado = {
  tipo: "tiempo" | "rounds_reps" | "peso" | "texto";
  segundos?: number;
  rondas?: number;
  reps?: number;
  peso_kg?: number;
  texto?: string;
};

type FilaResultado = {
  id: string;
  usuario_id: string;
  resultado: Resultado;
  validado: boolean;
  fecha_realizado: string;
  creado_en: string;
  nombre: string;
};

function formatearResultado(r: Resultado): string {
  switch (r.tipo) {
    case "tiempo": {
      const segundos = r.segundos ?? 0;
      const min = Math.floor(segundos / 60);
      const seg = segundos % 60;
      return `${min}:${seg.toString().padStart(2, "0")}`;
    }
    case "rounds_reps":
      return `${r.rondas ?? 0} rondas + ${r.reps ?? 0} reps`;
    case "peso":
      return `${r.peso_kg ?? 0} kg`;
    case "texto":
      return r.texto ?? "";
    default:
      return "";
  }
}

function ordenarResultados(filas: FilaResultado[]): FilaResultado[] {
  const tipo = filas[0]?.resultado?.tipo;
  return [...filas].sort((a, b) => {
    if (tipo === "tiempo") {
      return (a.resultado.segundos ?? 0) - (b.resultado.segundos ?? 0);
    }
    if (tipo === "rounds_reps") {
      const rondas = (b.resultado.rondas ?? 0) - (a.resultado.rondas ?? 0);
      if (rondas !== 0) return rondas;
      return (b.resultado.reps ?? 0) - (a.resultado.reps ?? 0);
    }
    if (tipo === "peso") {
      return (b.resultado.peso_kg ?? 0) - (a.resultado.peso_kg ?? 0);
    }
    return (
      new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime()
    );
  });
}

export default async function ResultadosWodPage({
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

  const coachBox = await getCoachBox(supabase, user.id);
  if (!coachBox) {
    redirect("/dashboard");
  }

  const { data: wod } = await supabase
    .from("wods")
    .select("id, nombre, formato, box_id")
    .eq("id", wodId)
    .maybeSingle<{
      id: string;
      nombre: string;
      formato: string;
      box_id: string;
    }>();

  if (!wod || wod.box_id !== coachBox.boxId) {
    notFound();
  }

  const { data: resultados } = await supabase
    .from("resultados")
    .select("id, usuario_id, resultado, validado, fecha_realizado, creado_en")
    .eq("wod_id", wodId)
    .order("creado_en", { ascending: true });

  const usuarioIds = Array.from(
    new Set((resultados ?? []).map((r) => r.usuario_id)),
  );

  let nombresPorId = new Map<string, string>();
  if (usuarioIds.length > 0) {
    const { data: perfiles } = await supabase
      .from("perfiles")
      .select("usuario_id, nombre")
      .in("usuario_id", usuarioIds);

    nombresPorId = new Map(
      (perfiles ?? []).map((p) => [p.usuario_id, p.nombre ?? "Sin nombre"]),
    );
  }

  const filas: FilaResultado[] = (resultados ?? []).map((r) => ({
    ...r,
    resultado: r.resultado as Resultado,
    nombre: nombresPorId.get(r.usuario_id) ?? "Sin nombre",
  }));

  const filasOrdenadas = ordenarResultados(filas);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/coach/wod"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">{wod.nombre}</h1>
          <p className="text-sm text-muted">
            {FORMATO_LABEL[wod.formato] ?? wod.formato}
          </p>
        </div>
      </div>

      {filasOrdenadas.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
          Todavía nadie ha registrado su resultado.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface px-4">
          {filasOrdenadas.map((r, i) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-black text-accent">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {r.nombre}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-accent">
                  {formatearResultado(r.resultado)}
                </span>
                {r.validado && (
                  <span className="text-xs text-muted" title="Validado">
                    ✓
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
