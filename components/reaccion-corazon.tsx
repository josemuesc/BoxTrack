"use client";

import { useState, useTransition } from "react";
import { toggleReaccionAction } from "@/app/actions/reacciones";

export default function ReaccionCorazon({
  logroId,
  conteoInicial,
  reaccionadoInicial,
}: {
  logroId: string;
  conteoInicial: number;
  reaccionadoInicial: boolean;
}) {
  const [reaccionado, setReaccionado] = useState(reaccionadoInicial);
  const [conteo, setConteo] = useState(conteoInicial);
  const [pending, startTransition] = useTransition();

  function alClic() {
    const siguiente = !reaccionado;
    setReaccionado(siguiente);
    setConteo((c) => c + (siguiente ? 1 : -1));

    startTransition(async () => {
      const { error } = await toggleReaccionAction(logroId);
      if (error) {
        // Revertir el optimismo si falló.
        setReaccionado(!siguiente);
        setConteo((c) => c + (siguiente ? -1 : 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={alClic}
      disabled={pending}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
        reaccionado
          ? "bg-accent/15 text-accent"
          : "bg-black/30 text-muted active:bg-black/40"
      }`}
    >
      <span>{reaccionado ? "❤️" : "🤍"}</span>
      <span>{conteo}</span>
    </button>
  );
}
