"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Opcion = { value: string; label: string };

export default function RangoFilter({
  meses,
  defaultDesde,
  defaultHasta,
}: {
  meses: Opcion[];
  defaultDesde: string;
  defaultHasta: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const desde = searchParams.get("desde") ?? defaultDesde;
  const hasta = searchParams.get("hasta") ?? defaultHasta;

  function ir(nuevoDesde: string, nuevoHasta: string) {
    const params = new URLSearchParams();
    params.set("desde", nuevoDesde);
    params.set("hasta", nuevoHasta);
    router.push(`${pathname}?${params.toString()}`);
  }

  function onDesdeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevoDesde = e.target.value;
    ir(nuevoDesde, hasta < nuevoDesde ? nuevoDesde : hasta);
  }

  function onHastaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevoHasta = e.target.value;
    ir(desde > nuevoHasta ? nuevoHasta : desde, nuevoHasta);
  }

  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <div>
        <label
          htmlFor="desde"
          className="mb-1.5 block text-xs font-medium text-muted"
        >
          Desde
        </label>
        <select
          id="desde"
          value={desde}
          onChange={onDesdeChange}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-accent"
        >
          {meses.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="hasta"
          className="mb-1.5 block text-xs font-medium text-muted"
        >
          Hasta
        </label>
        <select
          id="hasta"
          value={hasta}
          onChange={onHastaChange}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-accent"
        >
          {meses.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
