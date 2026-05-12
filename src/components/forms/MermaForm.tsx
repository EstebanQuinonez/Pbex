"use client";

import { useActionState, useMemo, useState } from "react";
import { submitMerma, type ActionState } from "@/app/actions/events";
import type { ProduccionParaMerma, RegistroCatalogs } from "@/lib/types/registro-catalog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

const initial: ActionState = {};

function fmtFecha(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function MermaForm({
  catalogs,
  producciones,
}: {
  catalogs: RegistroCatalogs;
  producciones: ProduccionParaMerma[];
}) {
  const [state, formAction, pending] = useActionState(submitMerma, initial);
  const [produccionId, setProduccionId] = useState("");
  const [mermaText, setMermaText] = useState("");

  const elegibles = useMemo(() => producciones.filter((p) => p.disponible > 1e-9), [producciones]);

  const seleccion = useMemo(
    () => producciones.find((p) => p.id === produccionId) ?? null,
    [produccionId, producciones],
  );

  const mermaNum = mermaText === "" ? NaN : Number(mermaText);
  const netaTras = useMemo(() => {
    if (!seleccion || !Number.isFinite(mermaNum) || mermaNum < 0) return null;
    return Math.max(0, seleccion.cantidad_bruta - seleccion.merma_acumulada - mermaNum);
  }, [seleccion, mermaNum]);

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

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Merma</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Debes elegir un registro previo de <code className="text-xs">PRODUCTION_RECORDED</code>. La merma se
          descuenta de esa <strong>producción total (bruta)</strong>; en reportes la producción útil es{" "}
          <strong>bruta − mermas enlazadas</strong>.
        </p>
      </div>

      {elegibles.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          No hay producciones con cupo para merma. Registra primero una producción con cantidad &gt; 0, o revisa que
          exista la columna <code className="text-xs">produccion_evento_id</code> (migración{" "}
          <code className="text-xs">007_merma_produccion_ref.sql</code>).
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
          <option value="">Selecciona una producción…</option>
          {elegibles.map((p) => (
            <option key={p.id} value={p.id}>
              {fmtFecha(p.timestamp)} · bruta {p.cantidad_bruta} · ya merma {p.merma_acumulada} · disponible{" "}
              {p.disponible.toFixed(2)}
            </option>
          ))}
        </select>
      </Field>

      {seleccion ? (
        <dl className="grid gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Producto</dt>
            <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
              {productoLabel(seleccion.producto_id)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Máquina</dt>
            <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
              {maquinaLabel(seleccion.maquina_id)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Turno</dt>
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
            <dt className="text-zinc-500">Disponible para merma</dt>
            <dd className="tabular-nums text-right font-medium text-emerald-800 dark:text-emerald-300">
              {seleccion.disponible.toFixed(4)}
            </dd>
          </div>
          {netaTras != null && Number.isFinite(mermaNum) ? (
            <div className="flex justify-between gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
              <dt className="text-zinc-500">Producción neta tras este registro</dt>
              <dd className="tabular-nums text-right font-semibold text-zinc-900 dark:text-zinc-50">
                {netaTras.toFixed(4)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <Field label="Merma a registrar (unidades)" htmlFor="merma">
        <Input
          id="merma"
          name="merma"
          type="number"
          min="0"
          step="0.01"
          max={seleccion != null ? seleccion.disponible : undefined}
          required
          value={mermaText}
          onChange={(e) => setMermaText(e.target.value)}
        />
      </Field>

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
        disabled={pending || elegibles.length === 0}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Guardando…" : "Registrar merma"}
      </button>
    </form>
  );
}
