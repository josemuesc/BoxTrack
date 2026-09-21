"use client";

import { useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import PasswordInput from "@/components/password-input";
import { loginAction, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <Logo className="mb-10" />

      <h1 className="mb-1 text-2xl font-bold text-foreground">
        Bienvenido de nuevo
      </h1>
      <p className="mb-8 text-sm text-muted">
        Inicia sesión para ver tu progreso.
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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-300"
            >
              Contraseña
            </label>
            <Link
              href="/recuperar"
              className="text-sm font-semibold text-accent"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
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
          {pending ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-accent">
          Regístrate
        </Link>
      </p>
    </main>
  );
}
