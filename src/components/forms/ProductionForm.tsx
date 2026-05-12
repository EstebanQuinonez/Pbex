"use client";

import { useActionState, useMemo, useState } from "react";
import { submitProduction, type ActionState } from "@/app/actions/events";
import type { RegistroCatalogs } from "@/lib/types/registro-catalog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

const initial: ActionState = {};

export function ProductionForm({ catalogs }: { catalogs: RegistroCatalogs }) {
  const [state, formAction, pending] = useActionState(submitProduction, initial);
  const [productoId, setProductoId] = useState("");
  const [turno, setTurno] = useState("");

  const producto = useMemo(
    () => catalogs.productos.find((p) => String(p.id) === productoId),
    [catalogs.productos, productoId],
  );
  const lineaId = producto?.linea_id;

  const maquinasFiltradas = useMemo(
    () => (lineaId == null ? [] : catalogs.maquinas.filter((m) => m.linea_id === lineaId)),
    [catalogs.maquinas, lineaId],
  );

  const encargadosFiltrados = useMemo(
    () =>
      lineaId == null || turno === ""
        ? []
        : catalogs.encargados.filter((e) => e.linea_id === lineaId && e.turno === turno),
    [catalogs.encargados, lineaId, turno],
  );

  const operariosFiltrados = useMemo(
    () => (turno === "" ? [] : catalogs.operarios.filter((o) => o.turno === turno)),
    [catalogs.operarios, turno],
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Producción</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Evento <code className="text-xs">PRODUCTION_RECORDED</code> con columnas enlazadas a catálogos. Indica la{" "}
          <strong>producción total (bruta)</strong>; las mermas se registran aparte y descuentan de este total.
        </p>
      </div>

      <Field label="Producto" htmlFor="producto_id">
        <select
          id="producto_id"
          name="producto_id"
          required
          value={productoId}
          onChange={(e) => {
            setProductoId(e.target.value);
          }}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Selecciona…</option>
          {catalogs.productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} — {p.descripcion}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Turno" htmlFor="turno">
        <select
          id="turno"
          name="turno"
          required
          value={turno}
          onChange={(e) => setTurno(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Selecciona…</option>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
      </Field>

      <Field label="Máquina (misma línea que el producto)" htmlFor="maquina_id">
        <select
          id="maquina_id"
          name="maquina_id"
          required
          disabled={maquinasFiltradas.length === 0}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">{lineaId == null ? "Elige producto primero" : "Selecciona máquina…"}</option>
          {maquinasFiltradas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.codigo} — {m.nombre}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Encargado de línea (misma línea y turno)" htmlFor="encargado_id">
        <select
          id="encargado_id"
          name="encargado_id"
          required
          disabled={encargadosFiltrados.length === 0}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">{turno === "" ? "Elige turno" : "Selecciona encargado…"}</option>
          {encargadosFiltrados.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Operario (mismo turno)" htmlFor="operario_id">
        <select
          id="operario_id"
          name="operario_id"
          required
          disabled={operariosFiltrados.length === 0}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">{turno === "" ? "Elige turno" : "Selecciona operario…"}</option>
          {operariosFiltrados.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Producción total — unidades fabricadas (bruta, antes de merma)" htmlFor="cantidad">
        <Input id="cantidad" name="cantidad" type="number" min="0" step="0.01" required />
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
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Guardando…" : "Registrar producción"}
      </button>
    </form>
  );
}
