import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membresia, error: membresiaError } = await supabase
    .from("membresias")
    .select("rol")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membresiaError) {
    console.error("Error consultando membresía:", membresiaError.message);
  }

  if (!membresia) {
    redirect("/onboarding");
  }

  if (membresia.rol === "coach") {
    redirect("/coach");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!perfil?.nombre) {
    redirect("/perfil/completar");
  }

  redirect("/dashboard");
}
