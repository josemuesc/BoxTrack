import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuitarGuardadoBoton from "@/components/quitar-guardado-boton";

type Movimiento = {
  nombre: string;
  reps: string;
  peso_kg: number | null;
  porcentaje_rm: number | null;
};

type GuardadoConWod = {
  id: string;
  fecha_guardado: string;
  wod: {
    id: string;
    nombre: string;
    formato: string;
    movimientos: Movimiento[];
    origen: string;
  } | null;
};

const FORMATO_LABEL: Record<string, string> = {
  for_time: "Por tiempo",
  amrap: "AMRAP",
  emom: "EMOM",
  max_weight: "Peso máximo",
  otro: "Otro",
};

export default async function WodsGuardadosPage() {
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

  const { data } = await supabase
    .from("guardados")
    .select(
      "id, fecha_guardado, wod:wods(id, nombre, formato, movimientos, origen)",
    )
    .eq("usuario_id", user.id)
    .order("fecha_guardado", { ascending: false });

  const guardados = (data ?? []) as unknown as GuardadoConWod[];

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
          Mis WODs guardados
        </h1>
      </div>

      {guardados.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
          Todavía no has guardado ningún WOD. Marca &quot;Guardar en mi lista
          de WODs&quot; al registrar un resultado.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {guardados
            .filter((g) => g.wod)
            .map((g) => (
              <li
                key={g.id}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-foreground">
                      {g.wod!.nombre}
                    </h2>
                    <p className="text-sm text-muted">
                      {FORMATO_LABEL[g.wod!.formato] ?? g.wod!.formato}
                      {g.wod!.origen === "personal_atleta" && " · Personal"}
                    </p>
                  </div>
                  <QuitarGuardadoBoton
                    guardadoId={g.id}
                    nombreWod={g.wod!.nombre}
                  />
                </div>

                <ul className="mt-3 flex flex-col gap-1.5">
                  {g.wod!.movimientos.map((m, i) => (
                    <li key={i} className="text-sm text-foreground">
                      <span className="font-semibold">{m.reps}</span>{" "}
                      {m.nombre}
                      {m.peso_kg ? ` · ${m.peso_kg} kg` : ""}
                      {m.porcentaje_rm ? ` · ${m.porcentaje_rm}% RM` : ""}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/wod/${g.wod!.id}/resultado`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-center text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20"
                >
                  Repetir y registrar resultado
                </Link>
              </li>
            ))}
        </ul>
      )}
    </main>
  );
}
