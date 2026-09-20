import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions/auth";
import Logo from "@/components/logo";

type MembresiaConBox = {
  rol: string;
  box: { id: string; nombre: string; ciudad: string | null } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("membresias")
    .select("rol, box:boxes(id, nombre, ciudad)")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  const membresia = data as unknown as MembresiaConBox | null;

  if (!membresia?.box) {
    redirect("/onboarding");
  }

  if (membresia.rol === "coach") {
    redirect("/coach");
  }

  const box = membresia.box;

  const { count: totalRm } = await supabase
    .from("registros_rm")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", user.id);

  const { data: movimientosData } = await supabase
    .from("registros_rm")
    .select("movimiento_id")
    .eq("usuario_id", user.id);

  const movimientosConPr = new Set(
    (movimientosData ?? []).map((r) => r.movimiento_id),
  ).size;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <Logo />
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-muted underline">
            Salir
          </button>
        </form>
      </header>

      <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-2 p-6">
        <p className="text-sm font-medium text-accent">Tu box</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
          {box.nombre}
        </h1>
        {box.ciudad && (
          <p className="mt-1 text-sm text-muted">📍 {box.ciudad}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-black/30 p-4">
            <p className="text-2xl font-black text-foreground">
              {totalRm ?? 0}
            </p>
            <p className="text-xs font-medium text-muted">RMs registrados</p>
          </div>
          <div className="rounded-xl bg-black/30 p-4">
            <p className="text-2xl font-black text-foreground">
              {movimientosConPr}
            </p>
            <p className="text-xs font-medium text-muted">Movimientos</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Link
          href="/rm/nuevo"
          className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-center text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-transform active:scale-[0.98]"
        >
          <span className="text-xl leading-none">+</span> Registrar nuevo RM
        </Link>
        <Link
          href="/progreso"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-center text-base font-bold text-foreground transition-colors active:bg-surface-2"
        >
          📈 Ver mi rendimiento
        </Link>
      </div>
    </main>
  );
}
