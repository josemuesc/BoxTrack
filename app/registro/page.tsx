"use client";

import { useActionState } from "react";
import Link from "next/link";
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
        <h1 className="mb-4 text-2xl font-bold text-neutral-900">
          ¡Ya casi listo!
        </h1>
        <p className="text-sm text-neutral-600">{state.message}</p>
        <Link
          href="/login"
          className="mt-6 text-sm font-medium text-neutral-900 underline"
        >
          Ir a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold text-neutral-900">
        Crea tu cuenta
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        Únete a BoxTrack con el código de invitación de tu box.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-neutral-700"
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
            className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="codigo"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Código de invitación del box
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
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-neutral-900 underline"
        >
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
