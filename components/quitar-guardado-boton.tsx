"use client";

import { eliminarGuardadoAction } from "@/app/actions/wods";

export default function QuitarGuardadoBoton({
  guardadoId,
  nombreWod,
}: {
  guardadoId: string;
  nombreWod: string;
}) {
  return (
    <form
      action={eliminarGuardadoAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `¿Seguro que quieres quitar "${nombreWod}" de tus guardados?`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="guardado_id" value={guardadoId} />
      <button
        type="submit"
        className="text-sm text-muted"
        aria-label="Quitar de guardados"
      >
        ✕
      </button>
    </form>
  );
}
