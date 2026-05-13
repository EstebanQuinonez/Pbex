"use client";

import { useActionState, useMemo, useState } from "react";
import { submitDefect, type ActionState } from "@/app/actions/events";
import type { RegistroCatalogs } from "@/lib/types/registro-catalog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

const initial: ActionState = {};

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function labelFallaNombre(nombre: string): string {
  return nombre.replaceAll("_", " ");
}

export function DefectForm({
  catalogs,
}: {
  catalogs: Pick<RegistroCatalogs, "maquinas" | "fallas_maquina">;
}) {
  const [state, formAction, pending] = useActionState(submitDefect, initial);
  const [localFallaEn, setLocalFallaEn] = useState(() => toDatetimeLocalValue(new Date()));

  const fallaOcurridaIso = useMemo(() => {
    const d = new Date(localFallaEn);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [localFallaEn]);

  const sinFallas = catalogs.fallas_maquina.length === 0;
  const sinMaquinas = catalogs.maquinas.length === 0;

  return (
    <form
      action={formAction}
      className="flex max-w-2xl flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Fallas de máquina</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Registra la máquina afectada, el <strong>tipo de falla</strong> del catálogo, la <strong>fecha y hora</strong> en
          que ocurrió y la cantidad afectada.
        </p>
      </div>

      {sinMaquinas || sinFallas ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          {sinMaquinas ? "No hay máquinas en catálogo. " : null}
          {sinFallas ? (
            <>
              Aún no hay tipos de falla configurados para máquinas. Pide a administración que complete el catálogo de fallas.
            </>
          ) : null}
        </p>
      ) : null}

      <Field label="Máquina" htmlFor="maquina_id">
        <select
          id="maquina_id"
          name="maquina_id"
          required
          disabled={sinMaquinas}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Selecciona máquina…</option>
          {catalogs.maquinas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.codigo} — {m.nombre}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tipo de falla" htmlFor="falla_maquina">
        <select
          id="falla_maquina"
          name="falla_maquina"
          required
          disabled={sinFallas}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 capitalize disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Selecciona tipo de falla…</option>
          {catalogs.fallas_maquina.map((f) => (
            <option key={f.id} value={f.nombre}>
              {labelFallaNombre(f.nombre)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Fecha y hora de la falla" htmlFor="falla_ocurrida_local">
        <Input
          id="falla_ocurrida_local"
          type="datetime-local"
          value={localFallaEn}
          onChange={(e) => setLocalFallaEn(e.target.value)}
          disabled={sinMaquinas || sinFallas}
          required
        />
        <input type="hidden" name="falla_ocurrida_at" value={fallaOcurridaIso} />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Usa la fecha y hora locales de tu equipo; el sistema las guarda de forma consistente.
        </p>
      </Field>

      <Field label="Cantidad afectada (unidades o piezas)" htmlFor="cantidad">
        <Input
          id="cantidad"
          name="cantidad"
          type="number"
          min="1"
          step="1"
          required
          disabled={sinMaquinas || sinFallas}
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
        disabled={pending || sinMaquinas || sinFallas || fallaOcurridaIso === ""}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Guardando…" : "Registrar falla"}
      </button>
    </form>
  );
}
