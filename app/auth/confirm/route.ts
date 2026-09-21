import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Punto de llegada de los enlaces que envía Supabase Auth por correo
// (recuperación de contraseña, confirmación de cuenta, etc). Supabase
// redirige aquí con un `code` de un solo uso (flujo PKCE); lo
// intercambiamos por una sesión y mandamos a la persona a `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const url = new URL("/login", origin);
  url.searchParams.set("error", "enlace_invalido");
  return NextResponse.redirect(url);
}
