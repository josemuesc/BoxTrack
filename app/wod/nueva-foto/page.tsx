import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WodFotoForm from "@/components/wod-foto-form";

export default async function NuevaFotoWodPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membresia } = await supabase
    .from("membresias")
    .select("box_id, rol")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membresia) {
    redirect("/onboarding");
  }

  if (membresia.rol === "coach") {
    redirect("/coach/wod/nueva-foto");
  }

  const { data: movimientos } = await supabase
    .from("movimientos")
    .select("id, nombre")
    .order("nombre");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/wod"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-lg text-foreground"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold text-foreground">
          Registrar mi WOD
        </h1>
      </div>

      <WodFotoForm
        boxId={membresia.box_id}
        origen="personal_atleta"
        movimientosCatalogo={movimientos ?? []}
      />
    </main>
  );
}
