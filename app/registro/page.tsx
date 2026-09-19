"use client";

import { useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import { signUpAction, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {};

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialState,
  );

  if (state?.success) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10 text-center">
        <Logo className="mx-auto mb-10" />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-2xl">
          🎉
        </div>
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          ¡Ya casi listo!
        </h1>
        <p className="text-sm leading-relaxed text-muted">{state.message}</p>
        <Link
          href="/login"
          className="mt-8 rounded-xl bg-accent px-4 py-3.5 text-base font-bold text-accent-foreground"
        >
          Ir a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <Logo className="mb-10" />

      <h1 className="mb-1 text-2xl font-bold text-foreground">
        Crea tu cuenta
      </h1>
      <p className="mb-8 text-sm text-muted">
        Únete con el código de invitación de tu box.
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
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none transition-colors focus:border-accent"
          />
        </div>

        <div>
          <label
            htmlFor="codigo"
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            Código de invitación del box
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
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
