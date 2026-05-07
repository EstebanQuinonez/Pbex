"use client";

import { useActionState } from "react";
import { createLinea, createMaterial, type ProductActionState } from "@/app/actions/productos";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

const initial: ProductActionState = {};

export function CatalogForms() {
  const [lineaState, lineaAction, lineaPending] = useActionState(createLinea, initial);
  const [materialState, materialAction, materialPending] = useActionState(createMaterial, initial);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={lineaAction} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold">Nueva línea de producción</h2>
        <div className="mt-4 space-y-3">
          <Field label="Nombre" htmlFor="linea_nombre">
            <Input id="linea_nombre" name="nombre" placeholder="Inyección o Soplado" required />
          </Field>
          <Field label="Descripción" htmlFor="linea_desc">
            <Input id="linea_desc" name="descripcion" placeholder="Descripción opcional" />
          </Field>
        </div>
        {lineaState.error ? <p className="mt-2 text-sm text-red-600">{lineaState.error}</p> : null}
        {lineaState.success ? <p className="mt-2 text-sm text-emerald-600">{lineaState.success}</p> : null}
        <button type="submit" disabled={lineaPending} className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          {lineaPending ? "Guardando..." : "Crear línea"}
        </button>
      </form>

      <form action={materialAction} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold">Nuevo material</h2>
        <div className="mt-4 space-y-3">
          <Field label="Nombre" htmlFor="material_nombre">
            <Input id="material_nombre" name="nombre" placeholder="Polipropileno" required />
          </Field>
          <Field label="Abreviatura" htmlFor="material_abrev">
            <Input id="material_abrev" name="abreviatura" placeholder="PP" required />
          </Field>
        </div>
        {materialState.error ? <p className="mt-2 text-sm text-red-600">{materialState.error}</p> : null}
        {materialState.success ? <p className="mt-2 text-sm text-emerald-600">{materialState.success}</p> : null}
        <button type="submit" disabled={materialPending} className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          {materialPending ? "Guardando..." : "Crear material"}
        </button>
      </form>
    </div>
  );
}
