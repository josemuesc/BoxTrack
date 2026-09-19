import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions/auth";

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

  if (!membresia || !membresia.box) {
    redirect("/onboarding");
  }

  const box = membresia.box;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <header className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">Tu box</p>
          <h1 className="text-xl font-bold text-neutral-900">{box.nombre}</h1>
          {box.ciudad && (
            <p className="text-sm text-neutral-500">{box.ciudad}</p>
          )}
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-neutral-500 underline">
            Salir
          </button>
        </form>
      </header>

      <div className="flex flex-col gap-3">
        <Link
          href="/rm/nuevo"
          className="rounded-xl bg-neutral-900 px-4 py-4 text-center text-base font-semibold text-white"
        >
          + Registrar nuevo RM
        </Link>
        <Link
          href="/progreso"
          className="rounded-xl border border-neutral-300 bg-white px-4 py-4 text-center text-base font-semibold text-neutral-900"
        >
          Ver mi progreso
        </Link>
      </div>
    </main>
  );
}
