import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la service_role key: bypassa RLS a propósito. Server-only —
// nunca importar desde un componente cliente ni un archivo sin "use server".
// Se usa solo para operaciones "del sistema" que cruzan usuarios, como leer
// las suscripciones push de todos los miembros de un box para notificarlos.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
