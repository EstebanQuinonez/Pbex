"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { submitMerma, type ActionState } from "@/app/actions/events";
import { MERMA_DEFECTO_TIPOS } from "@/lib/types/merma-defecto";
import type { ProduccionParaMerma, RegistroCatalogs } from "@/lib/types/registro-catalog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

const initial: ActionState = {};

function newLineId() {
  return globalThis.crypto?.randomUUID?.() ?? `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fmtFecha(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type LineDraft = { id: string; defecto: string; merma: string };

export function MermaForm({
  catalogs,
  producciones,
}: {
  catalogs: RegistroCatalogs;
  producciones: ProduccionParaMerma[];
}) {
  const [state, formAction, pending] = useActionState(submitMerma, initial);
  const [produccionId, setProduccionId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ id: newLineId(), defecto: "", merma: "" }]);

  useEffect(() => {
    if (state.success) {
      setLines([{ id: newLineId(), defecto: "", merma: "" }]);
    }
  }, [state.success]);

  const listaProduccion = useMemo(
    () => producciones.filter((p) => p.cantidad_bruta > 0),
    [producciones],
  );

  const hayCupo = useMemo(() => listaProduccion.some((p) => p.disponible > 1e-9), [listaProduccion]);

  const seleccion = useMemo(
    () => listaProduccion.find((p) => p.id === produccionId) ?? null,
    [produccionId, listaProduccion],
  );

  const puedeRegistrar = seleccion != null && seleccion.disponible > 1e-9;

  const sumCantidades = useMemo(() => {
    return lines.reduce((s, l) => {
      const n = Number(l.merma);
      return s + (Number.isFinite(n) && n > 0 ? n : 0);
    }, 0);
  }, [lines]);

  const eps = 1e-6;
  const sumaValida =
    puedeRegistrar &&
    sumCantidades > eps &&
    sumCantidades <= (seleccion?.disponible ?? 0) + eps &&
    lines.every((l) => l.defecto !== "" && l.merma.trim() !== "" && Number(l.merma) > 0);

  const netaTras = useMemo(() => {
    if (!seleccion || !puedeRegistrar) return null;
    return Math.max(0, seleccion.cantidad_bruta - seleccion.merma_acumulada - sumCantidades);
  }, [seleccion, puedeRegistrar, sumCantidades]);

  const productoLabel = (pid: number | null) => {
    if (pid == null) return "—";
    const p = catalogs.productos.find((x) => x.id === pid);
    return p ? `${p.codigo} — ${p.descripcion}` : `#${pid}`;
  };

  const maquinaLabel = (mid: number | null) => {
    if (mid == null) return "—";
    const m = catalogs.maquinas.find((x) => x.id === mid);
    return m ? `${m.codigo} — ${m.nombre}` : `#${mid}`;
  };

  const etiquetaOpcion = (p: ProduccionParaMerma) => {
    const prod = productoLabel(p.producto_id);
    const maq = maquinaLabel(p.maquina_id);
    const turno = p.turno ?? "—";
    const cupo = p.disponible > 1e-9 ? `disponible ${p.disponible.toFixed(2)} u.` : "sin cupo (merma ya igualó la bruta)";
    return `${fmtFecha(p.timestamp)} · Turno ${turno} · ${maq} · ${prod} · bruta ${p.cantidad_bruta} · ${cupo}`;
  };

  const defectoLabel = (value: string) => MERMA_DEFECTO_TIPOS.find((t) => t.value === value)?.label ?? value;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Merma</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Elige la <strong>producción de referencia</strong>. Puedes añadir <strong>varias líneas</strong> en un solo
          envío (por ejemplo 50 u. de un defecto y 40 u. de otro). Producto, turno y máquina vienen del evento de
          producción; aquí solo indicas <strong>tipo de defecto</strong> y <strong>cantidad</strong> por línea.
        </p>
      </div>

      {listaProduccion.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          No hay producciones recientes con cantidad bruta. Registra primero una producción. Si ya la registraste y sigues
          viendo este mensaje, aplica la migración <code className="text-xs">007_merma_produccion_ref.sql</code> y recarga
          la página.
        </p>
      ) : null}

      <Field label="Producción de referencia" htmlFor="produccion_evento_id">
        <select
          id="produccion_evento_id"
          name="produccion_evento_id"
          required
          value={produccionId}
          onChange={(e) => setProduccionId(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Selecciona la producción que acabas de registrar…</option>
          {listaProduccion.map((p) => (
            <option key={p.id} value={p.id} disabled={p.disponible <= 1e-9}>
              {etiquetaOpcion(p)}
            </option>
          ))}
        </select>
      </Field>

      {seleccion ? (
        <dl className="grid gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Producto (de la producción)</dt>
            <dd className="max-w-[65%] text-right font-medium text-zinc-900 dark:text-zinc-100">
              {productoLabel(seleccion.producto_id)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Máquina (de la producción)</dt>
            <dd className="max-w-[65%] text-right font-medium text-zinc-900 dark:text-zinc-100">
              {maquinaLabel(seleccion.maquina_id)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Turno (guardado en producción)</dt>
            <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">{seleccion.turno ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
            <dt className="text-zinc-500">Producción bruta</dt>
            <dd className="tabular-nums text-right font-semibold">{seleccion.cantidad_bruta}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Merma ya registrada</dt>
            <dd className="tabular-nums text-right">{seleccion.merma_acumulada}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Disponible para nuevas mermas</dt>
            <dd className="tabular-nums text-right font-medium text-emerald-800 dark:text-emerald-300">
              {seleccion.disponible.toFixed(4)}
            </dd>
          </div>
          {!puedeRegistrar ? (
            <p className="col-span-full text-xs text-amber-800 dark:text-amber-200">
              Esta producción ya no tiene cupo para más merma (suma de mermas = bruta). Elige otra o registra una nueva
              producción.
            </p>
          ) : null}
          {puedeRegistrar && sumCantidades > eps ? (
            <div className="flex justify-between gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
              <dt className="text-zinc-500">Total merma en este envío</dt>
              <dd className="tabular-nums text-right font-semibold text-zinc-900 dark:text-zinc-50">
                {sumCantidades.toFixed(4)} u.
              </dd>
            </div>
          ) : null}
          {netaTras != null && puedeRegistrar && sumCantidades > eps ? (
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">Producción neta tras este envío</dt>
              <dd className="tabular-nums text-right font-semibold text-zinc-900 dark:text-zinc-50">
                {netaTras.toFixed(4)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Líneas de merma (defecto + unidades)</p>
          <button
            type="button"
            disabled={!puedeRegistrar || lines.length >= 30}
            onClick={() => setLines((prev) => [...prev, { id: newLineId(), defecto: "", merma: "" }])}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Añadir línea
          </button>
        </div>

        {lines.map((line, idx) => (
          <div
            key={line.id}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-900/40 sm:flex-row sm:items-end"
          >
            <Field label={`Tipo de defecto (${idx + 1})`} htmlFor={`defecto_${idx}`}>
              <select
                id={`defecto_${idx}`}
                name={`defecto_${idx}`}
                required
                value={line.defecto}
                disabled={!puedeRegistrar}
                onChange={(e) => {
                  const v = e.target.value;
                  setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, defecto: v } : row)));
                }}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Selecciona…</option>
                {MERMA_DEFECTO_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Cantidad (${idx + 1})`} htmlFor={`merma_${idx}`}>
              <Input
                id={`merma_${idx}`}
                name={`merma_${idx}`}
                type="number"
                min="0"
                step="0.01"
                required
                value={line.merma}
                disabled={!puedeRegistrar}
                onChange={(e) => {
                  const v = e.target.value;
                  setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, merma: v } : row)));
                }}
              />
            </Field>
            <div className="flex shrink-0 items-end pb-0.5">
              <button
                type="button"
                disabled={!puedeRegistrar || lines.length <= 1}
                onClick={() => setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))}
                className="rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Quitar
              </button>
            </div>
            {line.defecto && line.merma && Number(line.merma) > 0 ? (
              <p className="w-full text-xs text-zinc-500 sm:col-span-3">
                Resumen línea: {defectoLabel(line.defecto)} — {Number(line.merma)} u.
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !hayCupo || !puedeRegistrar || !sumaValida}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Guardando…" : lines.length > 1 ? `Registrar ${lines.length} líneas de merma` : "Registrar merma"}
      </button>
    </form>
  );
}
