# BoxTrack

Plataforma web multi-box para el seguimiento de atletas de CrossFit. Cada gimnasio
("box") tiene su propio código de invitación; los atletas se registran, se unen
a su box y llevan el registro de sus RMs (récords máximos).

## Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth)
- Tailwind CSS, mobile-first
- Vercel

## Desarrollo local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env.local` y complétalo con las credenciales de tu
   proyecto de Supabase (ver sección siguiente).

3. Aplica las migraciones a tu proyecto de Supabase:

   ```bash
   npx supabase login
   npx supabase link --project-ref <tu-project-ref>
   npx supabase db push
   ```

4. Corre el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Base de datos y RLS

El esquema vive en `supabase/migrations/`. Incluye:

- `boxes`, `membresias`, `movimientos`, `registros_rm`, `logros`, `reacciones`.
- Row Level Security en todas las tablas: cada usuario solo puede ver/editar
  datos de los boxes donde tiene una membresía activa.
- Una función `join_box(codigo)` (`SECURITY DEFINER`) que valida el código de
  invitación y crea la membresía como `atleta`. El cliente nunca inserta
  directamente en `boxes` ni `membresias`.

`supabase/seed.sql` crea un box de ejemplo (`DEMO2026`) para pruebas locales.

## Variables de entorno

Ver `.env.example`. En Vercel, configúralas en
**Project Settings → Environment Variables** para los entornos Production,
Preview y Development.

## Despliegue

```bash
vercel link
vercel env pull .env.local
vercel deploy        # preview
vercel deploy --prod # producción
```
