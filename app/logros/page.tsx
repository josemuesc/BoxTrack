import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReaccionCorazon from "@/components/reaccion-corazon";
import { formatearPesoKgLb } from "@/lib/peso";

type LogroRow = {
  id: string;
  usuario_id: string;
  fecha: string;
  registro_rm: {
    peso_kg: number;
    movimiento: { nombre: string } | null;
  } | null;
};

export default async function LogrosPage() {
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

  const { data: logrosData } = await supabase
    .from("logros")
    .select(
      "id, usuario_id, fecha, registro_rm:registros_rm(peso_kg, movimiento:movimientos(nombre))",
    )
    .eq("box_id", membresia.box_id)
    .eq("tipo", "pr_movimiento")
    .order("fecha", { ascending: false })
    .limit(30)
    .returns<LogroRow[]>();

  const logros = logrosData ?? [];

  const usuarioIds = Array.from(new Set(logros.map((l) => l.usuario_id)));
  const nombresPorId = new Map<string, string>();
  if (usuarioIds.length > 0) {
    const { data: perfiles } = await supabase
      .from("perfiles")
      .select("usuario_id, nombre")
      .in("usuario_id", usuarioIds);
    for (const p of perfiles ?? []) {
      nombresPorId.set(p.usuario_id, p.nombre || "Sin nombre");
    }
  }

  const logroIds = logros.map((l) => l.id);
  const reaccionesPorLogro = new Map<string, Set<string>>();
  if (logroIds.length > 0) {
    const { data: reacciones } = await supabase
      .from("reacciones")
      .select("logro_id, usuario_id")
      .in("logro_id", logroIds)
      .eq("tipo", "corazon");
    for (const r of reacciones ?? []) {
      const set = reaccionesPorLogro.get(r.logro_id) ?? new Set<string>();
      set.add(r.usuario_id);
      reaccionesPorLogro.set(r.logro_id, set);
    }
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
        <h1 className="text-xl font-bold text-foreground">PRs del box</h1>
      </div>

      {logros.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-10 text-center text-sm text-muted">
          Todavía no hay PRs registrados en el box. ¡Sé el primero!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {logros.map((logro) => {
            const reacciones = reaccionesPorLogro.get(logro.id) ?? new Set();
            return (
              <li
                key={logro.id}
                id={`logro-${logro.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-4 target:border-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    🏆 {nombresPorId.get(logro.usuario_id) ?? "Sin nombre"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {logro.registro_rm?.movimiento?.nombre ?? "Movimiento"}
                    {logro.registro_rm?.peso_kg != null &&
                      ` · ${formatearPesoKgLb(logro.registro_rm.peso_kg)}`}
                  </p>
                </div>
                <ReaccionCorazon
                  logroId={logro.id}
                  conteoInicial={reacciones.size}
                  reaccionadoInicial={reacciones.has(user.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
