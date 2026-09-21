import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCoachBox } from "@/lib/coach";
import { logoutAction } from "@/app/actions/auth";
import Logo from "@/components/logo";
import NotificacionesBanner from "@/components/notificaciones-banner";

function haceDias(dias: number) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export default async function CoachDashboardPage() {
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

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!perfil?.nombre) {
    redirect("/perfil/completar");
  }

  const { boxId, boxNombre } = coachBox;
  const desde30d = haceDias(30);

  const { count: totalAtletas } = await supabase
    .from("membresias")
    .select("usuario_id", { count: "exact", head: true })
    .eq("box_id", boxId)
    .eq("rol", "atleta");

  const { count: prsUltimos30d } = await supabase
    .from("logros")
    .select("id", { count: "exact", head: true })
    .eq("box_id", boxId)
    .gte("fecha", desde30d);

  const { data: registrosRecientes } = await supabase
    .from("registros_rm")
    .select("movimiento_id, movimiento:movimientos(nombre)")
    .eq("box_id", boxId)
    .gte("fecha", desde30d);

  type RegistroReciente = {
    movimiento_id: string;
    movimiento: { nombre: string } | null;
  };
  const conteoMovimientos = new Map<string, { nombre: string; n: number }>();
  for (const r of (registrosRecientes ?? []) as unknown as RegistroReciente[]) {
    const actual = conteoMovimientos.get(r.movimiento_id);
    const nombre = r.movimiento?.nombre ?? "Otro";
    conteoMovimientos.set(r.movimiento_id, {
      nombre,
      n: (actual?.n ?? 0) + 1,
    });
  }
  const movimientoTop = Array.from(conteoMovimientos.values()).sort(
    (a, b) => b.n - a.n,
  )[0];

  const { data: logrosRecientes } = await supabase
    .from("logros")
    .select("usuario_id")
    .eq("box_id", boxId)
    .gte("fecha", desde30d);

  const conteoPorAtleta = new Map<string, number>();
  for (const l of logrosRecientes ?? []) {
    conteoPorAtleta.set(l.usuario_id, (conteoPorAtleta.get(l.usuario_id) ?? 0) + 1);
  }

  const topUsuarioIds = Array.from(conteoPorAtleta.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([usuarioId]) => usuarioId);

  let racha: { usuarioId: string; nombre: string; n: number }[] = [];
  if (topUsuarioIds.length > 0) {
    const { data: perfiles } = await supabase
      .from("perfiles")
      .select("usuario_id, nombre")
      .in("usuario_id", topUsuarioIds);

    const nombresPorId = new Map(
      (perfiles ?? []).map((p) => [p.usuario_id, p.nombre ?? "Sin nombre"]),
    );

    racha = topUsuarioIds.map((usuarioId) => ({
      usuarioId,
      nombre: nombresPorId.get(usuarioId) ?? "Sin nombre",
      n: conteoPorAtleta.get(usuarioId) ?? 0,
    }));
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <Logo />
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-muted underline">
            Salir
          </button>
        </form>
      </header>

      <NotificacionesBanner />

      <div className="mb-8">
        <p className="text-sm font-medium text-accent">Panel de coach</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
          {boxNombre}
        </h1>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-3xl font-black text-foreground">
            {totalAtletas ?? 0}
          </p>
          <p className="text-xs font-medium text-muted">Atletas activos</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-3xl font-black text-accent">
            {prsUltimos30d ?? 0}
          </p>
          <p className="text-xs font-medium text-muted">
            PRs en los últimos 30 días
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="truncate text-xl font-black text-foreground">
            {movimientoTop?.nombre ?? "—"}
          </p>
          <p className="text-xs font-medium text-muted">
            Movimiento más trabajado (30 días)
            {movimientoTop && ` · ${movimientoTop.n} registros`}
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/coach/wod"
          className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-center text-base font-bold text-accent-foreground shadow-lg shadow-accent/20"
        >
          🏋️ WOD de hoy
        </Link>
        <Link
          href="/coach/atletas"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-center text-base font-bold text-foreground"
        >
          👥 Listado de atletas
        </Link>
        <Link
          href="/coach/ranking"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-center text-base font-bold text-foreground"
        >
          🏆 Ranking por movimiento
        </Link>
        <Link
          href="/logros"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-center text-base font-bold text-foreground"
        >
          🎉 PRs del box
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
          Atletas en racha (30 días)
        </h2>
        {racha.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
            Todavía no hay PRs registrados en los últimos 30 días.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface px-4">
            {racha.map((r, i) => (
              <li
                key={r.usuarioId}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-black text-accent">
                    {i + 1}
                  </span>
                  <Link
                    href={`/coach/atletas/${r.usuarioId}`}
                    className="text-sm font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    {r.nombre}
                  </Link>
                </div>
                <span className="text-sm font-bold text-accent">
                  {r.n} {r.n === 1 ? "PR" : "PRs"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
