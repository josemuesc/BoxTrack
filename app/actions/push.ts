"use server";

import { createClient } from "@/lib/supabase/server";

export type GuardarSuscripcionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function guardarPushSubscriptionAction(
  input: GuardarSuscripcionInput,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      usuario_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function eliminarPushSubscriptionAction(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("usuario_id", user.id);
}
