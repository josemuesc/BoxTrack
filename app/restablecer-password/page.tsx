"use client";

import { useActionState } from "react";
import Logo from "@/components/logo";
import PasswordInput from "@/components/password-input";
import {
  updatePasswordAction,
  type AuthActionState,
} from "@/app/actions/auth";

const initialState: AuthActionState = {};

export default function RestablecerPasswordPage() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <Logo className="mb-10" />

      <h1 className="mb-1 text-2xl font-bold text-foreground">
        Elige una nueva contraseña
      </h1>
      <p className="mb-8 text-sm text-muted">
        Se usará la próxima vez que inicies sesión.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            Nueva contraseña
          </label>
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
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
          {pending ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </main>
  );
}
