import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MovementCard from "./movement-card";
import ProgresoChart from "./progreso-chart";

type Registro = {
  id: string;
  peso_kg: number;
  fecha: string;
  notas: string | null;
  movimiento_id: string;
  movimiento: { nombre: string } | null;
};

type Grupo = {
  movimientoId: string;
  nombre: string;
  registros: Registro[];
  pr: number;
  ultimaFecha: string;
};

export default async function ProgresoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("registros_rm")
    .select(
      "id, peso_kg, fecha, notas, movimiento_id, movimiento:movimientos(nombre)",
    )
    .eq("usuario_id", user.id)
    .order("fecha", { ascending: true });

  const registros = (data ?? []) as unknown as Registro[];

  const { data: pesos } = await supabase
    .from("registros_peso")
    .select("fecha, peso_kg")
    .eq("usuario_id", user.id)
    .order("fecha", { ascending: true });

  const historialPeso = pesos ?? [];

  const porMovimiento = registros.reduce<Record<string, Registro[]>>(
    (acc, r) => {
      acc[r.movimiento_id] = acc[r.movimiento_id] ?? [];
      acc[r.movimiento_id].push(r);
      return acc;
    },
    {},
  );

  const grupos: Grupo[] = Object.entries(porMovimiento)
    .map(([movimientoId, registros]) => ({
      movimientoId,
      nombre: registros[0].movimiento?.nombre ?? "Otro",
      registros,
      pr: Math.max(...registros.map((r) => r.peso_kg)),
      ultimaFecha: registros.at(-1)!.fecha,
    }))
    .sort((a, b) => (a.ultimaFecha < b.ultimaFecha ? 1 : -1));

  const mesActual = new Date().toISOString().slice(0, 7);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold text-foreground">Mi rendimiento</h1>
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          No se pudo cargar tu progreso.
        </p>
      )}

      {!error && registros.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-border bg-surface px-6 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-2xl">
            🏋️
          </div>
          <p className="text-sm text-muted">
            Aún no tienes RMs registrados.
          </p>
          <Link
            href="/rm/nuevo"
            className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground"
          >
            Registrar mi primer RM
          </Link>
        </div>
      )}

      {!error && registros.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-2xl font-black text-foreground">
                {registros.length}
              </p>
              <p className="text-xs font-medium text-muted">RMs totales</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-2xl font-black text-foreground">
                {grupos.length}
              </p>
              <p className="text-xs font-medium text-muted">Movimientos</p>
            </div>
          </div>

          {historialPeso.length > 0 && (
            <section className="mb-6 rounded-2xl border border-border bg-surface p-4">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">
                Peso corporal
              </h2>
              <ProgresoChart data={historialPeso} />
            </section>
          )}

          <div className="flex flex-col gap-4">
            {grupos.map((grupo) => (
              <MovementCard
                key={grupo.movimientoId}
                movimientoId={grupo.movimientoId}
                nombre={grupo.nombre}
                pr={grupo.pr}
                chartData={grupo.registros
                  .filter((r) => r.fecha.startsWith(mesActual))
                  .map((r) => ({ fecha: r.fecha, peso_kg: r.peso_kg }))}
                ultimos={[...grupo.registros].reverse().slice(0, 3)}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
