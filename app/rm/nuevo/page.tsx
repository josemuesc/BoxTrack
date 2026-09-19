import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RmForm from "./rm-form";

export default async function NuevoRmPage() {
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

  const { data: movimientos } = await supabase
    .from("movimientos")
    .select("id, nombre")
    .order("nombre");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">
          Registrar nuevo RM
        </h1>
        <Link href="/dashboard" className="text-sm text-neutral-500 underline">
          Volver
        </Link>
      </div>

      <RmForm boxId={membresia.box_id} movimientos={movimientos ?? []} />
    </main>
  );
}
