import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Registro = {
  id: string;
  peso_kg: number;
  fecha: string;
  notas: string | null;
  movimiento: { nombre: string } | null;
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
    .select("id, peso_kg, fecha, notas, movimiento:movimientos(nombre)")
    .eq("usuario_id", user.id)
    .order("fecha", { ascending: false });

  const registros = (data ?? []) as unknown as Registro[];

  const porMovimiento = registros.reduce<Record<string, Registro[]>>(
    (acc, r) => {
      const nombre = r.movimiento?.nombre ?? "Otro";
      acc[nombre] = acc[nombre] ?? [];
      acc[nombre].push(r);
      return acc;
    },
    {},
  );

  const movimientosOrdenados = Object.keys(porMovimiento).sort();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Mi progreso</h1>
        <Link href="/dashboard" className="text-sm text-neutral-500 underline">
          Volver
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          No se pudo cargar tu progreso.
        </p>
      )}

      {!error && registros.length === 0 && (
        <p className="text-sm text-neutral-500">
          Aún no tienes RMs registrados.{" "}
          <Link href="/rm/nuevo" className="underline">
            Registra el primero
          </Link>
          .
        </p>
      )}

      <div className="flex flex-col gap-6">
        {movimientosOrdenados.map((nombre) => (
          <section key={nombre}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {nombre}
            </h2>
            <ul className="flex flex-col divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
              {porMovimiento[nombre].map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div>
                    <p className="text-base font-medium text-neutral-900">
                      {r.peso_kg} kg
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(`${r.fecha}T00:00:00`).toLocaleDateString(
                        "es-CO",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </p>
                  </div>
                  {r.notas && (
                    <p className="max-w-[50%] text-right text-xs text-neutral-500">
                      {r.notas}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
