import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCoachBox } from "@/lib/coach";

type Fila = {
  usuarioId: string;
  nombre: string;
  rmKg: number;
  rmFecha: string;
  pesoAsOf: number | null;
  relativo: number | null;
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ movimiento?: string; orden?: string }>;
}) {
  const { movimiento: movimientoParam, orden: ordenParam } =
    await searchParams;

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

  const { boxId, boxNombre } = coachBox;

  const { data: movimientos } = await supabase
    .from("movimientos")
    .select("id, nombre")
    .order("nombre");

  const listaMovimientos = movimientos ?? [];
  const movimientoId = movimientoParam ?? listaMovimientos[0]?.id ?? "";
  const orden = ordenParam === "relativo" ? "relativo" : "absoluto";

  const movimientoActual = listaMovimientos.find((m) => m.id === movimientoId);

  const { data: membresias } = await supabase
    .from("membresias")
    .select("usuario_id")
    .eq("box_id", boxId)
    .eq("rol", "atleta");

  const usuarioIds = (membresias ?? []).map((m) => m.usuario_id);

  let filas: Fila[] = [];

  if (movimientoId && usuarioIds.length > 0) {
    const [{ data: perfiles }, { data: registrosRm }, { data: registrosPeso }] =
      await Promise.all([
        supabase
          .from("perfiles")
          .select("usuario_id, nombre")
          .in("usuario_id", usuarioIds),
        supabase
          .from("registros_rm")
          .select("usuario_id, peso_kg, fecha")
          .eq("box_id", boxId)
          .eq("movimiento_id", movimientoId)
          .order("fecha", { ascending: true }),
        supabase
          .from("registros_peso")
          .select("usuario_id, peso_kg, fecha")
          .eq("box_id", boxId)
          .order("fecha", { ascending: true }),
      ]);

    const nombresPorId = new Map(
      (perfiles ?? []).map((p) => [p.usuario_id, p.nombre ?? "Sin nombre"]),
    );

    // Al recorrer ascendente y sobrescribir, cada usuario queda con su RM
    // más reciente para este movimiento.
    const ultimoRmPorUsuario = new Map<
      string,
      { peso_kg: number; fecha: string }
    >();
    for (const r of registrosRm ?? []) {
      ultimoRmPorUsuario.set(r.usuario_id, {
        peso_kg: r.peso_kg,
        fecha: r.fecha,
      });
    }

    const pesosPorUsuario = new Map<
      string,
      { peso_kg: number; fecha: string }[]
    >();
    for (const p of registrosPeso ?? []) {
      const lista = pesosPorUsuario.get(p.usuario_id) ?? [];
      lista.push({ peso_kg: p.peso_kg, fecha: p.fecha });
      pesosPorUsuario.set(p.usuario_id, lista);
    }

    filas = Array.from(ultimoRmPorUsuario.entries()).map(
      ([usuarioId, rm]) => {
        const historialPeso = pesosPorUsuario.get(usuarioId) ?? [];
        // Peso más reciente registrado HASTA la fecha del RM (no el actual).
        const pesoAsOf =
          [...historialPeso]
            .filter((p) => p.fecha <= rm.fecha)
            .at(-1)?.peso_kg ?? null;

        return {
          usuarioId,
          nombre: nombresPorId.get(usuarioId) ?? "Sin nombre",
          rmKg: rm.peso_kg,
          rmFecha: rm.fecha,
          pesoAsOf,
          relativo: pesoAsOf ? rm.peso_kg / pesoAsOf : null,
        };
      },
    );

    filas.sort((a, b) => {
      if (orden === "relativo") {
        if (a.relativo === null && b.relativo === null) return 0;
        if (a.relativo === null) return 1;
        if (b.relativo === null) return -1;
        return b.relativo - a.relativo;
      }
      return b.rmKg - a.rmKg;
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/coach"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Ranking por movimiento
          </h1>
          <p className="text-xs text-muted">{boxNombre}</p>
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {listaMovimientos.map((m) => (
          <Link
            key={m.id}
            href={`/coach/ranking?movimiento=${m.id}&orden=${orden}`}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors ${
              m.id === movimientoId
                ? "bg-accent text-accent-foreground"
                : "border border-border bg-surface text-muted"
            }`}
          >
            {m.nombre}
          </Link>
        ))}
      </div>

      {filas.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          Ningún atleta tiene un RM registrado en{" "}
          {movimientoActual?.nombre ?? "este movimiento"} todavía.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Atleta</th>
                <th className="px-4 py-3 font-semibold">
                  <Link
                    href={`/coach/ranking?movimiento=${movimientoId}&orden=absoluto`}
                    className={
                      orden === "absoluto" ? "text-accent" : "hover:text-foreground"
                    }
                  >
                    RM absoluto {orden === "absoluto" && "↓"}
                  </Link>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <Link
                    href={`/coach/ranking?movimiento=${movimientoId}&orden=relativo`}
                    className={
                      orden === "relativo" ? "text-accent" : "hover:text-foreground"
                    }
                  >
                    RM relativo {orden === "relativo" && "↓"}
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((f, i) => (
                <tr key={f.usuarioId} className="transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3 text-muted">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/coach/atletas/${f.usuarioId}`}
                      className="font-semibold text-foreground underline-offset-2 hover:text-accent hover:underline"
                    >
                      {f.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {f.rmKg} kg
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {f.relativo !== null ? `${f.relativo.toFixed(2)}x` : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        RM relativo = RM más reciente ÷ peso corporal más reciente registrado
        hasta esa fecha.
      </p>
    </main>
  );
}
