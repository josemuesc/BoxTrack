"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  extraerWodDesdeFotoAction,
  guardarWodAction,
  type MovimientoWodInput,
} from "@/app/actions/wods";

type Movimiento = { id: string; nombre: string };
type Formato = "for_time" | "amrap" | "emom" | "max_weight" | "otro";

const FORMATOS: { value: Formato; label: string }[] = [
  { value: "for_time", label: "Por tiempo (For Time)" },
  { value: "amrap", label: "AMRAP" },
  { value: "emom", label: "EMOM" },
  { value: "max_weight", label: "Peso máximo" },
  { value: "otro", label: "Otro" },
];

const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.72;

async function fotoAComprimidaBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return dataUrl.split(",")[1] ?? "";
}

function buscarMovimientoId(nombre: string, catalogo: Movimiento[]) {
  const match = catalogo.find(
    (m) => m.nombre.toLowerCase() === nombre.toLowerCase(),
  );
  return match?.id ?? null;
}

export default function WodFotoForm({
  boxId,
  origen,
  movimientosCatalogo,
}: {
  boxId: string;
  origen: "oficial_coach" | "personal_atleta";
  movimientosCatalogo: Movimiento[];
}) {
  const router = useRouter();
  const inputCamaraRef = useRef<HTMLInputElement>(null);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState<"captura" | "procesando" | "revision">(
    "captura",
  );
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [formato, setFormato] = useState<Formato>("for_time");
  const [movimientos, setMovimientos] = useState<MovimientoWodInput[]>([]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setPaso("procesando");

    try {
      const base64 = await fotoAComprimidaBase64(file);
      const result = await extraerWodDesdeFotoAction({
        base64,
        mediaType: "image/jpeg",
      });

      if ("error" in result) {
        setError(result.error);
        setPaso("captura");
        return;
      }

      setNombre(result.data.nombre);
      setFormato(result.data.formato);
      setMovimientos(
        result.data.movimientos.map((m) => ({
          nombre: m.nombre,
          reps: m.reps,
          peso_kg: m.peso_kg,
          porcentaje_rm: m.porcentaje_rm,
          movimiento_id: buscarMovimientoId(m.nombre, movimientosCatalogo),
        })),
      );
      setPaso("revision");
    } catch {
      setError("No se pudo leer la foto. Intenta de nuevo.");
      setPaso("captura");
    }
  }

  function actualizarMovimiento(
    index: number,
    cambios: Partial<MovimientoWodInput>,
  ) {
    setMovimientos((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...cambios } : m)),
    );
  }

  function eliminarMovimiento(index: number) {
    setMovimientos((prev) => prev.filter((_, i) => i !== index));
  }

  function agregarMovimiento() {
    setMovimientos((prev) => [
      ...prev,
      {
        nombre: "",
        reps: "",
        peso_kg: null,
        porcentaje_rm: null,
        movimiento_id: null,
      },
    ]);
  }

  async function handleGuardar() {
    setError(null);
    setGuardando(true);

    const result = await guardarWodAction({
      boxId,
      origen,
      nombre,
      formato,
      movimientos,
    });

    setGuardando(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    const destino =
      origen === "personal_atleta"
        ? `/wod/${result.wodId}/resultado`
        : "/coach/wod";
    router.push(destino);
  }

  if (paso === "captura" || paso === "procesando") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm text-muted">
          Toma una foto de la pizarra del WOD. La imagen no se guarda: solo
          se usa para extraer el WOD.
        </p>
        <input
          ref={inputCamaraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
        <input
          ref={inputGaleriaRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            disabled={paso === "procesando"}
            onClick={() => inputCamaraRef.current?.click()}
            className="rounded-2xl bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-opacity disabled:opacity-50"
          >
            {paso === "procesando" ? "Leyendo la foto…" : "📷 Tomar foto"}
          </button>
          <button
            type="button"
            disabled={paso === "procesando"}
            onClick={() => inputGaleriaRef.current?.click()}
            className="rounded-2xl border border-border bg-surface px-6 py-4 text-base font-bold text-foreground transition-colors disabled:opacity-50"
          >
            🖼️ Elegir de galería
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        Revisa y corrige lo que la IA interpretó antes de guardar.
      </p>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">
          Nombre del WOD
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">
          Formato
        </label>
        <select
          value={formato}
          onChange={(e) => setFormato(e.target.value as Formato)}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-none focus:border-accent"
        >
          {FORMATOS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-300">
            Movimientos
          </label>
          <button
            type="button"
            onClick={agregarMovimiento}
            className="text-sm font-semibold text-accent"
          >
            + Agregar
          </button>
        </div>

        {movimientos.map((m, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3.5"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Movimiento"
                value={m.nombre}
                onChange={(e) =>
                  actualizarMovimiento(i, { nombre: e.target.value })
                }
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => eliminarMovimiento(i)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted"
                aria-label="Eliminar movimiento"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              placeholder='Reps (ej: 21-15-9)'
              value={m.reps}
              onChange={(e) =>
                actualizarMovimiento(i, { reps: e.target.value })
              }
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Peso (kg)"
                value={m.peso_kg ?? ""}
                onChange={(e) =>
                  actualizarMovimiento(i, {
                    peso_kg: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="% RM"
                value={m.porcentaje_rm ?? ""}
                onChange={(e) =>
                  actualizarMovimiento(i, {
                    porcentaje_rm:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>

            <select
              value={m.movimiento_id ?? ""}
              onChange={(e) =>
                actualizarMovimiento(i, {
                  movimiento_id: e.target.value || null,
                })
              }
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="">Vincular a movimiento del catálogo…</option>
              {movimientosCatalogo.map((mc) => (
                <option key={mc.id} value={mc.id}>
                  {mc.nombre}
                </option>
              ))}
            </select>
          </div>
        ))}

        {movimientos.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-3.5 py-4 text-center text-sm text-muted">
            No hay movimientos. Agrega al menos uno.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleGuardar}
        disabled={guardando}
        className="mt-2 rounded-xl bg-accent px-4 py-3.5 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-opacity active:opacity-80 disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar WOD"}
      </button>
    </div>
  );
}
