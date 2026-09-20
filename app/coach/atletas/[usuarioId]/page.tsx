import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCoachBox } from "@/lib/coach";
import ProgresoChart from "@/app/progreso/progreso-chart";

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
};

export default async function DetalleAtletaCoachPage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const { usuarioId } = await params;

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

  const { boxId } = coachBox;

  const { data: membresia } = await supabase
    .from("membresias")
    .select("fecha_ingreso")
    .eq("usuario_id", usuarioId)
    .eq("box_id", boxId)
    .eq("rol", "atleta")
    .maybeSingle();

  if (!membresia) {
    redirect("/coach/atletas");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, altura_cm")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  const { data: registrosData } = await supabase
    .from("registros_rm")
    .select(
      "id, peso_kg, fecha, notas, movimiento_id, movimiento:movimientos(nombre)",
    )
    .eq("usuario_id", usuarioId)
    .eq("box_id", boxId)
    .order("fecha", { ascending: true });

  const registros = (registrosData ?? []) as unknown as Registro[];

  const porMovimiento = registros.reduce<Record<string, Registro[]>>(
    (acc, r) => {
      acc[r.movimiento_id] = acc[r.movimiento_id] ?? [];
      acc[r.movimiento_id].push(r);
      return acc;
    },
    {},
  );

  const grupos: Grupo[] = Object.entries(porMovimiento)
    .map(([movimientoId, regs]) => ({
      movimientoId,
      nombre: regs[0].movimiento?.nombre ?? "Otro",
      registros: regs,
      pr: Math.max(...regs.map((r) => r.peso_kg)),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const { data: pesos } = await supabase
    .from("registros_peso")
    .select("fecha, peso_kg")
    .eq("usuario_id", usuarioId)
    .eq("box_id", boxId)
    .order("fecha", { ascending: true });

  const historialPeso = pesos ?? [];
  const pesoMasReciente = historialPeso.at(-1)?.peso_kg ?? null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/coach/atletas"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold text-foreground">
          {perfil?.nombre ?? "Sin nombre"}
        </h1>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-lg font-black text-foreground">
            {new Date(membresia.fecha_ingreso).toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-xs font-medium text-muted">Ingreso al box</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-lg font-black text-foreground">
            {registros.length}
          </p>
          <p className="text-xs font-medium text-muted">RMs registrados</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-lg font-black text-foreground">
            {pesoMasReciente !== null ? `${pesoMasReciente} kg` : "N/A"}
          </p>
          <p className="text-xs font-medium text-muted">Peso más reciente</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-lg font-black text-foreground">
            {perfil?.altura_cm ? `${perfil.altura_cm} cm` : "N/A"}
          </p>
          <p className="text-xs font-medium text-muted">Altura</p>
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

      {grupos.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          Este atleta aún no tiene RMs registrados.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {grupos.map((grupo) => (
            <section
              key={grupo.movimientoId}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
                  {grupo.nombre}
                </h2>
                <div className="text-right">
                  <p className="text-lg font-black leading-none text-accent">
                    {grupo.pr} kg
                  </p>
                  <p className="text-[11px] font-medium text-muted">
                    PR actual
                  </p>
                </div>
              </div>

              <ProgresoChart
                data={grupo.registros.map((r) => ({
                  fecha: r.fecha,
                  peso_kg: r.peso_kg,
                }))}
              />

              <ul className="mt-3 flex flex-col divide-y divide-border border-t border-border">
                {[...grupo.registros]
                  .reverse()
                  .slice(0, 3)
                  .map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-4 py-2.5"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {r.peso_kg} kg
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(`${r.fecha}T00:00:00`).toLocaleDateString(
                          "es-CO",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </p>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
