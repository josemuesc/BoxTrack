"use client";

import { useRouter } from "next/navigation";
import ProgresoChart from "./progreso-chart";

type Registro = {
  id: string;
  peso_kg: number;
  fecha: string;
  notas: string | null;
};

export default function MovementCard({
  movimientoId,
  nombre,
  pr,
  chartData,
  ultimos,
}: {
  movimientoId: string;
  nombre: string;
  pr: number;
  chartData: { fecha: string; peso_kg: number }[];
  ultimos: Registro[];
}) {
  const router = useRouter();

  function irAlDetalle() {
    router.push(`/progreso/${movimientoId}`);
  }

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={irAlDetalle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") irAlDetalle();
      }}
      className="cursor-pointer rounded-2xl border border-border bg-surface p-4 text-left transition-colors active:bg-surface-2"
    >
      <div className="mb-2 flex items-start justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
          {nombre}
        </h2>
        <div className="text-right">
          <p className="text-lg font-black leading-none text-accent">
            {pr} kg
          </p>
          <p className="text-[11px] font-medium text-muted">PR actual</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div onClick={(e) => e.stopPropagation()}>
          <ProgresoChart data={chartData} />
        </div>
      ) : (
        <p className="py-8 text-center text-xs text-muted">
          Sin registros este mes
        </p>
      )}

      <ul className="mt-3 flex flex-col divide-y divide-border border-t border-border">
        {ultimos.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-4 py-2.5"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {r.peso_kg} kg
              </p>
              <p className="text-xs text-muted">
                {new Date(`${r.fecha}T00:00:00`).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            {r.notas && (
              <p className="max-w-[50%] text-right text-xs text-muted">
                {r.notas}
              </p>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-center text-xs font-semibold text-accent">
        Ver historial completo →
      </p>
    </section>
  );
}
