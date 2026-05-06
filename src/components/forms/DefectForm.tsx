"use client";

import { useActionState } from "react";
import { submitDefect, type ActionState } from "@/app/actions/events";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

const initial: ActionState = {};

export function DefectForm() {
  const [state, formAction, pending] = useActionState(submitDefect, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Defectos de máquina</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Se guarda como evento <code className="text-xs">DEFECT_RECORDED</code>.
        </p>
      </div>

      <Field label="Nombre de la máquina" htmlFor="nombre_maquina">
        <Input id="nombre_maquina" name="nombre_maquina" required placeholder="Ej. Envasadora 2" />
      </Field>

      <Field label="Tipo de defecto" htmlFor="tipo_defecto">
        <Input id="tipo_defecto" name="tipo_defecto" required placeholder="Ej. Sellado irregular" />
      </Field>

      <Field label="Cantidad" htmlFor="cantidad">
        <Input id="cantidad" name="cantidad" type="number" min="1" step="1" required />
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
        {pending ? "Guardando…" : "Registrar defecto"}
      </button>
    </form>
  );
}
