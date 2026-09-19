"use client";

import { useActionState } from "react";
import { createRmAction, type RmActionState } from "@/app/actions/rm";

type Movimiento = { id: string; nombre: string };

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

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="box_id" value={boxId} />

      <div>
        <label
          htmlFor="movimiento_id"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Movimiento
        </label>
        <select
          id="movimiento_id"
          name="movimiento_id"
          required
          defaultValue=""
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none"
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
        <label
          htmlFor="peso_kg"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Peso (kg)
        </label>
        <input
          id="peso_kg"
          name="peso_kg"
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="fecha"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Fecha
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          required
          defaultValue={today}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="notas"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Notas (opcional)
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-base font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar RM"}
      </button>
    </form>
  );
}
