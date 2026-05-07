"use client";

import { useActionState, useMemo, useState } from "react";
import { createProducto, type ProductActionState } from "@/app/actions/productos";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { LineaProduccion, Material } from "@/lib/types/productos";

const initial: ProductActionState = {};

function SpecInput({ name, label }: { name: string; label: string }) {
  return (
    <Field label={label} htmlFor={name}>
      <Input id={name} name={name} type="text" inputMode="decimal" autoComplete="off" />
    </Field>
  );
}

export function ProductForm({
  lineas,
  materiales,
}: {
  lineas: LineaProduccion[];
  materiales: Material[];
}) {
  const [state, formAction, pending] = useActionState(createProducto, initial);
  const [lineaId, setLineaId] = useState<string>(lineas[0] ? String(lineas[0].id) : "");

  const lineaSeleccionada = useMemo(
    () => lineas.find((l) => String(l.id) === lineaId),
    [lineaId, lineas],
  );
  const esInyeccion = lineaSeleccionada?.nombre.toLowerCase().includes("inye") ?? false;

  return (
    <form action={formAction} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold">Datos del producto</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Código" htmlFor="codigo">
          <Input id="codigo" name="codigo" placeholder="PT001082" required />
        </Field>
        <Field label="Estado" htmlFor="estado">
          <select id="estado" name="estado" className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" defaultValue="activo">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </Field>
        <Field label="Descripción" htmlFor="descripcion">
          <Input id="descripcion" name="descripcion" required />
        </Field>
        <Field label="Línea" htmlFor="linea_id">
          <select
            id="linea_id"
            name="linea_id"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={lineaId}
            onChange={(e) => setLineaId(e.target.value)}
            required
          >
            {lineas.map((linea) => (
              <option key={linea.id} value={linea.id}>
                {linea.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Material" htmlFor="material_id">
          <select id="material_id" name="material_id" className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" required>
            {materiales.map((material) => (
              <option key={material.id} value={material.id}>
                {material.nombre} ({material.abreviatura})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <h3 className="text-sm font-semibold">
          Especificación {esInyeccion ? "de inyección" : "de soplado"}
        </h3>
        {esInyeccion ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <SpecInput name="peso_g_nominal" label="Peso nominal (g)" />
            <SpecInput name="peso_g_tolerancia" label="Peso tolerancia (g)" />
            <SpecInput name="diam_exterior_mm_nominal" label="Diám. exterior nominal (mm)" />
            <SpecInput name="diam_exterior_mm_tolerancia" label="Diám. exterior tolerancia (mm)" />
            <SpecInput name="diam_interior_mm_nominal" label="Diám. interior nominal (mm)" />
            <SpecInput name="diam_interior_mm_tolerancia" label="Diám. interior tolerancia (mm)" />
            <SpecInput name="alto_largo_mm_nominal" label="Alto/Largo nominal (mm)" />
            <SpecInput name="alto_largo_mm_tolerancia" label="Alto/Largo tolerancia (mm)" />
            <SpecInput name="ancho_mm_nominal" label="Ancho nominal (mm)" />
            <SpecInput name="ancho_mm_tolerancia" label="Ancho tolerancia (mm)" />
            <SpecInput name="espesor_pared_mm_nominal" label="Espesor pared nominal (mm)" />
            <SpecInput name="espesor_pared_mm_tolerancia" label="Espesor pared tolerancia (mm)" />
            <SpecInput name="espesor_preco_mm_nominal" label="Espesor preco nominal (mm)" />
            <SpecInput name="espesor_preco_mm_tolerancia" label="Espesor preco tolerancia (mm)" />
            <SpecInput name="diam_ext_sin_hilo_mm_nominal" label="Diám. ext. sin hilo nominal (mm)" />
            <SpecInput name="diam_ext_sin_hilo_mm_tolerancia" label="Diám. ext. sin hilo tolerancia (mm)" />
          </div>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <SpecInput name="peso_g" label="Peso (g)" />
            <SpecInput name="peso_tolerancia" label="Peso tolerancia (g)" />
            <SpecInput name="diam_ext_boca_mm" label="Diám. exterior boca (mm)" />
            <SpecInput name="diam_ext_cuello_mm" label="Diám. exterior cuello (mm)" />
            <SpecInput name="diam_int_cuello_mm" label="Diám. interior cuello (mm)" />
            <SpecInput name="altura_boca_mm" label="Altura boca (mm)" />
          </div>
        )}
      </div>

      {state.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-sm text-emerald-600">{state.success}</p> : null}

      <button type="submit" disabled={pending || !lineas.length || !materiales.length} className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Guardando..." : "Crear producto"}
      </button>
    </form>
  );
}
