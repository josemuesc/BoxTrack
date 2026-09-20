import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RangoFilter from "./rango-filter";
import PorcentajeCalculadora from "./porcentaje-calculadora";
import ProgresoChart from "../progreso-chart";

type Registro = {
  id: string;
  peso_kg: number;
  fecha: string;
  notas: string | null;
};

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function etiquetaMes(ym: string) {
  return capitalizar(
    new Date(`${ym}-01T00:00:00`).toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
    }),
  );
}

export default async function DetalleMovimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ movimientoId: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const { movimientoId } = await params;
  const { desde: desdeParam, hasta: hastaParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: movimiento } = await supabase
    .from("movimientos")
    .select("id, nombre")
    .eq("id", movimientoId)
    .maybeSingle();

  if (!movimiento) {
    redirect("/progreso");
  }

  const { data, error } = await supabase
    .from("registros_rm")
    .select("id, peso_kg, fecha, notas")
    .eq("usuario_id", user.id)
    .eq("movimiento_id", movimientoId)
    .order("fecha", { ascending: true });

  const registrosAsc = (data ?? []) as Registro[];

  const mesesSet = new Set(registrosAsc.map((r) => r.fecha.slice(0, 7)));
  const meses = Array.from(mesesSet)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: etiquetaMes(value) }));

  const defaultDesde = meses[0]?.value ?? new Date().toISOString().slice(0, 7);
  const defaultHasta =
    meses.at(-1)?.value ?? new Date().toISOString().slice(0, 7);

  const desde = desdeParam ?? defaultDesde;
  const hasta = hastaParam ?? defaultHasta;

  const prKg =
    registrosAsc.length > 0
      ? Math.max(...registrosAsc.map((r) => r.peso_kg))
      : 0;

  const registrosFiltradosAsc = registrosAsc.filter((r) => {
    const ym = r.fecha.slice(0, 7);
    return ym >= desde && ym <= hasta;
  });
  const registrosFiltradosDesc = [...registrosFiltradosAsc].reverse();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/progreso"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold uppercase tracking-wide text-foreground">
          {movimiento.nombre}
        </h1>
      </div>

      {prKg > 0 && <PorcentajeCalculadora prKg={prKg} />}

      {meses.length > 1 && (
        <RangoFilter
          meses={meses}
          defaultDesde={defaultDesde}
          defaultHasta={defaultHasta}
        />
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          No se pudo cargar el historial.
        </p>
      )}

      {!error && (
        <>
          <div className="mb-4 rounded-2xl border border-border bg-surface p-4">
            {registrosFiltradosAsc.length > 0 ? (
              <ProgresoChart
                data={registrosFiltradosAsc.map((r) => ({
                  fecha: r.fecha,
                  peso_kg: r.peso_kg,
                }))}
              />
            ) : (
              <p className="py-8 text-center text-xs text-muted">
                No hay registros en este rango.
              </p>
            )}
          </div>

          <p className="mb-3 text-xs font-medium text-muted">
            {registrosFiltradosDesc.length}{" "}
            {registrosFiltradosDesc.length === 1 ? "registro" : "registros"}
          </p>

          {registrosFiltradosDesc.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted">
                No hay registros en este rango.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface px-4">
              {registrosFiltradosDesc.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <div>
                    <p className="text-base font-bold text-foreground">
                      {r.peso_kg} kg
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(`${r.fecha}T00:00:00`).toLocaleDateString(
                        "es-CO",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </p>
                  </div>
                  {r.notas && (
                    <p className="max-w-[55%] text-right text-xs text-muted">
                      {r.notas}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
