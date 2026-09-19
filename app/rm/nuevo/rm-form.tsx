"use client";

import { useActionState, useMemo, useState } from "react";
import { createRmAction, type RmActionState } from "@/app/actions/rm";

type Movimiento = { id: string; nombre: string };
type Unidad = "kg" | "lb";

const LB_TO_KG = 0.45359237;
const initialState: RmActionState = {};

export default function RmForm({
  boxId,
  movimientos,
}: {
  boxId: string;
  movimientos: Movimiento[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [state, formAction, pending] = useActionState(
    createRmAction,
    initialState,
  );
  const [unidad, setUnidad] = useState<Unidad>("kg");
  const [pesoInput, setPesoInput] = useState("");

  const pesoKg = useMemo(() => {
    const valor = Number(pesoInput);
    if (!pesoInput || Number.isNaN(valor)) return "";
    const kg = unidad === "lb" ? valor * LB_TO_KG : valor;
    return kg.toFixed(2);
  }, [pesoInput, unidad]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="box_id" value={boxId} />
      <input type="hidden" name="peso_kg" value={pesoKg} />

      <div>
        <label
          htmlFor="movimiento_id"
          className="mb-1.5 block text-sm font-medium text-neutral-300"
        >
          Movimiento
        </label>
        <select
          id="movimiento_id"
          name="movimiento_id"
          required
          defaultValue=""
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors focus:border-accent"
        >
          <option value="" disabled>
            Selecciona un movimiento
          </option>
          {movimientos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="peso_visible"
            className="block text-sm font-medium text-neutral-300"
          >
            Peso
          </label>
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            {(["kg", "lb"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnidad(u)}
                className={`rounded-md px-3 py-1 text-xs font-bold uppercase transition-colors ${
                  unidad === u
                    ? "bg-accent text-accent-foreground"
                    : "text-muted"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <input
          id="peso_visible"
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          required
          value={pesoInput}
          onChange={(e) => setPesoInput(e.target.value)}
          placeholder={unidad === "kg" ? "Ej: 100" : "Ej: 220"}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors focus:border-accent"
        />
        {unidad === "lb" && pesoKg && (
          <p className="mt-1.5 text-xs text-muted">≈ {pesoKg} kg</p>
        )}
      </div>

      <div>
        <label
          htmlFor="fecha"
          className="mb-1.5 block text-sm font-medium text-neutral-300"
        >
          Fecha
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          required
          defaultValue={today}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors focus:border-accent [color-scheme:dark]"
        />
      </div>

      <div>
        <label
          htmlFor="notas"
          className="mb-1.5 block text-sm font-medium text-neutral-300"
        >
          Notas (opcional)
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors focus:border-accent"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-accent px-4 py-3.5 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-opacity active:opacity-80 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar RM"}
      </button>
    </form>
  );
}
