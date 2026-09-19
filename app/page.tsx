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

  const { data: membresia } = await supabase
    .from("membresias")
    .select("box_id")
    .eq("usuario_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membresia) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
