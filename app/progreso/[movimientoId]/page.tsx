import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MesFilter from "./mes-filter";

type Registro = {
  id: string;
  peso_kg: number;
  fecha: string;
  notas: string | null;
};

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function DetalleMovimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ movimientoId: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { movimientoId } = await params;
  const { mes } = await searchParams;

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
    .order("fecha", { ascending: false });

  const registros = (data ?? []) as Registro[];

  const mesesMap = new Map<string, string>();
  for (const r of registros) {
    const ym = r.fecha.slice(0, 7);
    if (!mesesMap.has(ym)) {
      mesesMap.set(
        ym,
        capitalizar(
          new Date(`${ym}-01T00:00:00`).toLocaleDateString("es-CO", {
            month: "long",
            year: "numeric",
          }),
        ),
      );
    }
  }
  const meses = Array.from(mesesMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => b.value.localeCompare(a.value));

  const registrosFiltrados = mes
    ? registros.filter((r) => r.fecha.startsWith(mes))
    : registros;

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

      {meses.length > 0 && (
        <div className="mb-4">
          <MesFilter meses={meses} />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          No se pudo cargar el historial.
        </p>
      )}

      {!error && (
        <>
          <p className="mb-3 text-xs font-medium text-muted">
            {registrosFiltrados.length}{" "}
            {registrosFiltrados.length === 1 ? "registro" : "registros"}
          </p>

          {registrosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted">
                No hay registros en este mes.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface px-4">
              {registrosFiltrados.map((r) => (
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
