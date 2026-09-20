"use client";

import { useActionState } from "react";
import Logo from "@/components/logo";
import {
  completarPerfilAction,
  type PerfilActionState,
} from "@/app/actions/perfil";
import { logoutAction } from "@/app/actions/auth";

const initialState: PerfilActionState = {};

export default function CompletarPerfilPage() {
  const [state, formAction, pending] = useActionState(
    completarPerfilAction,
    initialState,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <Logo className="mb-10" />

      <h1 className="mb-1 text-2xl font-bold text-foreground">
        Completa tu perfil
      </h1>
      <p className="mb-8 text-sm text-muted">
        Un par de datos para tu coach y tu progreso. Solo se piden una vez.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="nombre"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            Nombre completo
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors focus:border-accent"
          />
        </div>

        <div>
          <label
            htmlFor="altura_cm"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            Altura (cm) <span className="text-muted">— opcional</span>
          </label>
          <input
            id="altura_cm"
            name="altura_cm"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            placeholder="Ej: 172"
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
          className="mt-2 rounded-xl bg-accent px-4 py-3.5 text-base font-bold text-accent-foreground transition-opacity active:opacity-80 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Continuar"}
        </button>
      </form>

      <form action={logoutAction} className="mt-6 text-center">
        <button type="submit" className="text-sm text-muted underline">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
