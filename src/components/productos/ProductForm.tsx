"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createProducto, updateProducto, type ProductActionState } from "@/app/actions/productos";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { LineaProduccion, Material, ProductoEditDefaults } from "@/lib/types/productos";

const initial: ProductActionState = {};

function SpecInput({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <Field label={label} htmlFor={name}>
      <Input
        id={name}
        name={name}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        defaultValue={defaultValue}
      />
    </Field>
  );
}

export function ProductForm({
  lineas,
  materiales,
  mode = "create",
  defaults,
}: {
  lineas: LineaProduccion[];
  materiales: Material[];
  mode?: "create" | "edit";
  defaults?: ProductoEditDefaults;
}) {
  const serverAction = mode === "edit" ? updateProducto : createProducto;
  const [state, formAction, pending] = useActionState(serverAction, initial);
  const router = useRouter();

  const [lineaId, setLineaId] = useState(() =>
    defaults ? String(defaults.linea_id) : lineas[0] ? String(lineas[0].id) : "",
  );

  const lineaSeleccionada = useMemo(
    () => lineas.find((l) => String(l.id) === lineaId),
    [lineaId, lineas],
  );
  const esInyeccion = lineaSeleccionada?.nombre.toLowerCase().includes("inye") ?? false;

  const iny = defaults?.espec_inyeccion;
  const sop = defaults?.espec_soplado;
  const vIny = (k: string) => (iny?.[k] != null ? String(iny[k]) : "");
  const vSop = (k: string) => (sop?.[k] != null ? String(sop[k]) : "");

  const titulo = mode === "edit" ? "Editar datos del producto" : "Datos del producto";

  // En edición, tras mostrar el mensaje de éxito, redirigimos a la lista al cabo de unos segundos.
  useEffect(() => {
    if (mode !== "edit" || !state?.success) return;
    const id = setTimeout(() => {
      router.push("/productos");
    }, 1800);
    return () => clearTimeout(id);
  }, [mode, state?.success, router]);

  return (
    <form action={formAction} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      {mode === "edit" && defaults ? <input type="hidden" name="producto_id" value={defaults.id} /> : null}

      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Solo código, descripción, línea y material son obligatorios. Las medidas son opcionales.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Código" htmlFor="codigo">
          <Input id="codigo" name="codigo" placeholder="PT001082" required defaultValue={defaults?.codigo ?? ""} />
        </Field>
        <Field label="Estado" htmlFor="estado">
          <select
            id="estado"
            name="estado"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            defaultValue={defaults?.estado ?? "activo"}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </Field>
        <Field label="Descripción" htmlFor="descripcion">
          <Input id="descripcion" name="descripcion" required defaultValue={defaults?.descripcion ?? ""} />
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
          <select
            id="material_id"
            name="material_id"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            required
            defaultValue={
              defaults ? String(defaults.material_id) : materiales[0] ? String(materiales[0].id) : ""
            }
          >
            {materiales.map((material) => (
              <option key={material.id} value={material.id}>
                {material.nombre} ({material.abreviatura})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <h3 className="text-sm font-semibold">Especificación {esInyeccion ? "de inyección" : "de soplado"} (opcional)</h3>
        {esInyeccion ? (
          <div key="iny" className="mt-3 grid gap-3 md:grid-cols-2">
            <SpecInput name="peso" label="Peso" defaultValue={vIny("peso")} />
            <SpecInput name="diam_exterior_mm" label="Diám. exterior (mm)" defaultValue={vIny("diam_exterior_mm")} />
            <SpecInput name="diam_ext_sin_hilo_mm" label="Diám. ext. sin hilo (mm)" defaultValue={vIny("diam_ext_sin_hilo_mm")} />
            <SpecInput name="diam_interior_mm" label="Diám. interior (mm)" defaultValue={vIny("diam_interior_mm")} />
            <SpecInput name="alto_largo_mm" label="Alto / largo (mm)" defaultValue={vIny("alto_largo_mm")} />
            <SpecInput name="ancho_mm" label="Ancho (mm)" defaultValue={vIny("ancho_mm")} />
            <SpecInput name="espesor_pared_mm" label="Espesor pared (mm)" defaultValue={vIny("espesor_pared_mm")} />
            <SpecInput name="espesor_preco_mm" label="Espesor preco (mm)" defaultValue={vIny("espesor_preco_mm")} />
          </div>
        ) : (
          <div key="sop" className="mt-3 grid gap-3 md:grid-cols-2">
            <SpecInput name="peso" label="Peso" defaultValue={vSop("peso")} />
            <SpecInput name="diam_ext_boca_mm" label="Diám. exterior boca (mm)" defaultValue={vSop("diam_ext_boca_mm")} />
            <SpecInput name="diam_ext_cuello_mm" label="Diám. exterior cuello (mm)" defaultValue={vSop("diam_ext_cuello_mm")} />
            <SpecInput name="diam_int_cuello_mm" label="Diám. interior cuello (mm)" defaultValue={vSop("diam_int_cuello_mm")} />
            <SpecInput name="altura_boca_mm" label="Altura boca (mm)" defaultValue={vSop("altura_boca_mm")} />
          </div>
        )}
      </div>

      {state.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
      {state.success ? (
        <p className="mt-3 text-sm text-emerald-600">
          {mode === "edit" ? state.success ?? "Cambios guardados." : state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !lineas.length || !materiales.length}
        className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear producto"}
      </button>
    </form>
  );
}
