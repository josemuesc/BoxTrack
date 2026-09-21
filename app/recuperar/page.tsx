"use client";

import { useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import {
  requestPasswordResetAction,
  type AuthActionState,
} from "@/app/actions/auth";

const initialState: AuthActionState = {};

export default function RecuperarPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state?.success) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10 text-center">
        <Logo className="mx-auto mb-10" />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-2xl">
          ✉️
        </div>
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          Revisa tu correo
        </h1>
        <p className="text-sm leading-relaxed text-muted">{state.message}</p>
        <Link
          href="/login"
          className="mt-8 rounded-xl bg-accent px-4 py-3.5 text-base font-bold text-accent-foreground"
        >
          Volver a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <Logo className="mb-10" />

      <h1 className="mb-1 text-2xl font-bold text-foreground">
        ¿Olvidaste tu contraseña?
      </h1>
      <p className="mb-8 text-sm text-muted">
        Ingresa tu correo y te enviaremos un enlace para restablecerla.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
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
          {pending ? "Enviando…" : "Enviar enlace"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-accent">
          Volver a iniciar sesión
        </Link>
      </p>
    </main>
  );
}
