"use client";

import { useActionState, useState } from "react";
import Logo from "@/components/logo";
import {
  joinBoxAction,
  logoutAction,
  type AuthActionState,
} from "@/app/actions/auth";

type Rol = "atleta" | "coach";

const initialState: AuthActionState = {};

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(
    joinBoxAction,
    initialState,
  );
  const [rol, setRol] = useState<Rol>("atleta");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <Logo className="mb-10" />

      <h1 className="mb-1 text-2xl font-bold text-foreground">
        Únete a tu box
      </h1>
      <p className="mb-8 text-sm text-muted">
        Ingresa el código de invitación que te dio tu coach.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="rol" value={rol} />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-neutral-300">
            Me estoy uniendo como
          </span>
          <div className="flex rounded-xl border border-border bg-surface p-1">
            {(
              [
                { value: "atleta", label: "Atleta" },
                { value: "coach", label: "Coach" },
              ] as const
            ).map((opcion) => (
              <button
                key={opcion.value}
                type="button"
                onClick={() => setRol(opcion.value)}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                  rol === opcion.value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted"
                }`}
              >
                {opcion.label}
              </button>
            ))}
          </div>
          {rol === "coach" && (
            <p className="mt-1.5 text-xs text-muted">
              Selecciona esto solo si tienes autorización de tu box.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="codigo"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            Código de invitación
          </label>
          <input
            id="codigo"
            name="codigo"
            type="text"
            required
            placeholder="Ej: SCORPIONS"
            autoCapitalize="characters"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base uppercase text-foreground outline-none transition-colors placeholder:normal-case placeholder:text-neutral-600 focus:border-accent"
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
          {pending ? "Uniéndote…" : "Unirme al box"}
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
