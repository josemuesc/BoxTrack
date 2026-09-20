import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCoachBox } from "@/lib/coach";

export default async function ListadoAtletasPage() {
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

  const { data: membresias } = await supabase
    .from("membresias")
    .select("usuario_id, fecha_ingreso")
    .eq("box_id", boxId)
    .eq("rol", "atleta")
    .order("fecha_ingreso", { ascending: true });

  const usuarioIds = (membresias ?? []).map((m) => m.usuario_id);

  const [{ data: perfiles }, { data: registros }] = await Promise.all([
    usuarioIds.length > 0
      ? supabase
          .from("perfiles")
          .select("usuario_id, nombre")
          .in("usuario_id", usuarioIds)
      : Promise.resolve({ data: [] as { usuario_id: string; nombre: string | null }[] }),
    usuarioIds.length > 0
      ? supabase
          .from("registros_rm")
          .select("usuario_id")
          .eq("box_id", boxId)
      : Promise.resolve({ data: [] as { usuario_id: string }[] }),
  ]);

  const nombresPorId = new Map(
    (perfiles ?? []).map((p) => [p.usuario_id, p.nombre ?? "Sin nombre"]),
  );

  const conteoRm = new Map<string, number>();
  for (const r of registros ?? []) {
    conteoRm.set(r.usuario_id, (conteoRm.get(r.usuario_id) ?? 0) + 1);
  }

  const atletas = (membresias ?? []).map((m) => ({
    usuarioId: m.usuario_id,
    nombre: nombresPorId.get(m.usuario_id) ?? "Sin nombre",
    fechaIngreso: m.fecha_ingreso as string,
    totalRm: conteoRm.get(m.usuario_id) ?? 0,
  }));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/coach"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Listado de atletas
          </h1>
          <p className="text-xs text-muted">{boxNombre}</p>
        </div>
      </div>

      {atletas.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          Aún no hay atletas en este box.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Ingreso al box</th>
                <th className="px-4 py-3 font-semibold">RMs registrados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {atletas.map((a) => (
                <tr key={a.usuarioId} className="transition-colors hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link
                      href={`/coach/atletas/${a.usuarioId}`}
                      className="font-semibold text-foreground underline-offset-2 hover:text-accent hover:underline"
                    >
                      {a.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(a.fechaIngreso).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {a.totalRm}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
