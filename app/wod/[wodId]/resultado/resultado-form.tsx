"use client";

import { useActionState, useState } from "react";
import {
  crearResultadoAction,
  eliminarGuardadoAction,
  type ResultadoActionState,
} from "@/app/actions/wods";

const initialState: ResultadoActionState = {};

export default function ResultadoForm({
  wodId,
  boxId,
  formato,
  guardadoInicialId,
}: {
  wodId: string;
  boxId: string;
  formato: string;
  guardadoInicialId: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    crearResultadoAction,
    initialState,
  );
  const [guardar, setGuardar] = useState(false);
  const [guardadoId, setGuardadoId] = useState(guardadoInicialId);
  const [quitando, setQuitando] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="wod_id" value={wodId} />
      <input type="hidden" name="box_id" value={boxId} />
      <input type="hidden" name="formato" value={formato} />

      {formato === "for_time" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">
            Tiempo (mm:ss)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="minutos"
              inputMode="numeric"
              min="0"
              required
              placeholder="min"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none focus:border-accent"
            />
            <span className="text-lg font-bold text-muted">:</span>
            <input
              type="number"
              name="segundos_parte"
              inputMode="numeric"
              min="0"
              max="59"
              required
              placeholder="seg"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none focus:border-accent"
            />
          </div>
        </div>
      )}

      {(formato === "amrap" || formato === "emom") && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              Rondas completas
            </label>
            <input
              type="number"
              name="rondas"
              inputMode="numeric"
              min="0"
              required
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              Reps extra
            </label>
            <input
              type="number"
              name="reps_extra"
              inputMode="numeric"
              min="0"
              defaultValue={0}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none focus:border-accent"
            />
          </div>
        </div>
      )}

      {formato === "max_weight" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">
            Peso (kg)
          </label>
          <input
            type="number"
            name="peso_kg"
            inputMode="decimal"
            step="0.5"
            min="0"
            required
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none focus:border-accent"
          />
        </div>
      )}

      {formato !== "for_time" &&
        formato !== "amrap" &&
        formato !== "emom" &&
        formato !== "max_weight" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              Resultado
            </label>
            <textarea
              name="texto"
              rows={3}
              required
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none focus:border-accent"
            />
          </div>
        )}

      {guardadoId ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
          <span className="text-sm font-medium text-neutral-300">
            ⭐ Ya está en tu lista de guardados
          </span>
          <button
            type="button"
            disabled={quitando}
            onClick={async () => {
              setQuitando(true);
              const fd = new FormData();
              fd.set("guardado_id", guardadoId);
              await eliminarGuardadoAction(fd);
              setGuardadoId(null);
              setQuitando(false);
            }}
            className="text-sm font-semibold text-red-400 disabled:opacity-50"
          >
            {quitando ? "Quitando…" : "Quitar"}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <label className="flex items-center gap-2.5 text-sm font-medium text-neutral-300">
            <input
              type="checkbox"
              name="guardar"
              checked={guardar}
              onChange={(e) => setGuardar(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[#ff7a1a]"
            />
            Guardar en mi lista de WODs
          </label>
        </div>
      )}

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
        {pending ? "Guardando…" : "Registrar resultado"}
      </button>
    </form>
  );
}
