"use client";

import { useState } from "react";

const PORCENTAJES_RAPIDOS = [50, 60, 65, 70, 75, 80, 85, 90, 95];
const KG_A_LB = 2.2046226218;

export default function PorcentajeCalculadora({ prKg }: { prKg: number }) {
  const [porcentaje, setPorcentaje] = useState(70);

  const resultadoKg = (prKg * porcentaje) / 100;
  const resultadoLb = resultadoKg * KG_A_LB;

  return (
    <section className="mb-4 rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
        Calculadora de porcentajes
      </h2>

      <div className="mb-4 flex flex-wrap gap-2">
        {PORCENTAJES_RAPIDOS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPorcentaje(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              porcentaje === p
                ? "bg-accent text-accent-foreground"
                : "border border-border text-muted"
            }`}
          >
            {p}%
          </button>
        ))}
      </div>

      <input
        type="range"
        min={10}
        max={110}
        step={1}
        value={porcentaje}
        onChange={(e) => setPorcentaje(Number(e.target.value))}
        className="w-full accent-[#ff7a1a]"
        aria-label="Porcentaje de tu PR"
      />
      <div className="mt-1 mb-4 flex justify-between text-xs text-muted">
        <span>10%</span>
        <span className="font-bold text-accent">{porcentaje}%</span>
        <span>110%</span>
      </div>

      <div className="rounded-xl bg-black/30 p-4 text-center">
        <p className="text-3xl font-black text-accent">
          {resultadoKg.toFixed(1)} kg
        </p>
        <p className="mt-1 text-sm text-muted">
          ≈ {resultadoLb.toFixed(1)} lb
        </p>
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
        Calculado sobre tu PR actual de {prKg} kg. Redondea al disco más
        cercano disponible en tu box.
      </p>
    </section>
  );
}
