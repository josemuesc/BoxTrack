"use client";

import { useActionState } from "react";
import {
  joinBoxAction,
  logoutAction,
  type AuthActionState,
} from "@/app/actions/auth";

const initialState: AuthActionState = {};

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(
    joinBoxAction,
    initialState,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold text-neutral-900">
        Únete a tu box
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        Ingresa el código de invitación que te dio tu coach.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="codigo"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Código de invitación
          </label>
          <input
            id="codigo"
            name="codigo"
            type="text"
            required
            placeholder="Ej: DEMO2026"
            autoCapitalize="characters"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base uppercase text-neutral-900 focus:border-neutral-900 focus:outline-none"
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
          {pending ? "Uniéndote…" : "Unirme al box"}
        </button>
      </form>

      <form action={logoutAction} className="mt-6 text-center">
        <button type="submit" className="text-sm text-neutral-500 underline">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
