"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function MesFilter({
  meses,
}: {
  meses: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const actual = searchParams.get("mes") ?? "todos";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const valor = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (valor === "todos") {
      params.delete("mes");
    } else {
      params.set("mes", valor);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <select
      value={actual}
      onChange={onChange}
      className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-medium text-foreground outline-none focus:border-accent"
    >
      <option value="todos">Todos los meses</option>
      {meses.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
