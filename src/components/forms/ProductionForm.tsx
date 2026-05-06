"use client";

import { useActionState } from "react";
import { submitProduction, type ActionState } from "@/app/actions/events";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

const initial: ActionState = {};

export function ProductionForm() {
  const [state, formAction, pending] = useActionState(submitProduction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Producción diaria</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Se guarda como evento <code className="text-xs">PRODUCTION_RECORDED</code>.
        </p>
      </div>

      <Field label="Línea de producción" htmlFor="linea_produccion">
        <Input id="linea_produccion" name="linea_produccion" required placeholder="Ej. Línea A" />
      </Field>

      <Field label="Turno" htmlFor="turno">
        <Input id="turno" name="turno" required placeholder="Mañana / Tarde / Noche" />
      </Field>

      <Field label="Producción total (unidades)" htmlFor="produccion_total">
        <Input
          id="produccion_total"
          name="produccion_total"
          type="number"
          min="0"
          step="1"
          required
        />
      </Field>

      <Field label="Porcentaje de desperdicio (%)" htmlFor="porcentaje_desperdicio">
        <Input
          id="porcentaje_desperdicio"
          name="porcentaje_desperdicio"
          type="number"
          min="0"
          max="100"
          step="0.1"
          required
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
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Guardando…" : "Registrar producción"}
      </button>
    </form>
  );
}
