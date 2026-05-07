"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ProductActionState = { error?: string; success?: string };

const lineaSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  descripcion: z.string().optional(),
});

const materialSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  abreviatura: z.string().min(2, "Abreviatura requerida").max(10, "Máximo 10 caracteres"),
});

const baseProductoSchema = z.object({
  codigo: z.string().min(3, "Código requerido"),
  descripcion: z.string().min(3, "Descripción requerida"),
  linea_id: z.coerce.number().int().positive("Selecciona línea"),
  material_id: z.coerce.number().int().positive("Selecciona material"),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
});

const CAMPOS_INYECCION = [
  "peso_g_nominal",
  "peso_g_tolerancia",
  "diam_exterior_mm_nominal",
  "diam_exterior_mm_tolerancia",
  "diam_interior_mm_nominal",
  "diam_interior_mm_tolerancia",
  "alto_largo_mm_nominal",
  "alto_largo_mm_tolerancia",
  "ancho_mm_nominal",
  "ancho_mm_tolerancia",
  "espesor_pared_mm_nominal",
  "espesor_pared_mm_tolerancia",
  "espesor_preco_mm_nominal",
  "espesor_preco_mm_tolerancia",
  "diam_ext_sin_hilo_mm_nominal",
  "diam_ext_sin_hilo_mm_tolerancia",
] as const;

const CAMPOS_SOPLADO = [
  "peso_g",
  "peso_tolerancia",
  "diam_ext_boca_mm",
  "diam_ext_cuello_mm",
  "diam_int_cuello_mm",
  "altura_boca_mm",
] as const;

/** Valor de especificación como text en BD (vacío = no se envía el campo). */
function maybeSpecText(value: FormDataEntryValue | null): string | undefined {
  if (value == null) return undefined;
  const t = String(value).trim();
  return t === "" ? undefined : t;
}

function pickEspecInyeccion(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of CAMPOS_INYECCION) {
    const v = maybeSpecText(formData.get(k));
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function pickEspecSoplado(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of CAMPOS_SOPLADO) {
    const v = maybeSpecText(formData.get(k));
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function createLinea(
  _prev: ProductActionState | undefined,
  formData: FormData,
): Promise<ProductActionState> {
  const supabase = await createClient();
  const parsed = lineaSchema.safeParse({
    nombre: String(formData.get("nombre") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim() || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { error } = await supabase.from("linea_produccion").insert({
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/productos");
  return { success: "Línea creada." };
}

export async function createMaterial(
  _prev: ProductActionState | undefined,
  formData: FormData,
): Promise<ProductActionState> {
  const supabase = await createClient();
  const parsed = materialSchema.safeParse({
    nombre: String(formData.get("nombre") ?? "").trim(),
    abreviatura: String(formData.get("abreviatura") ?? "").trim().toUpperCase(),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { error } = await supabase.from("material").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/productos");
  return { success: "Material creado." };
}

export async function createProducto(
  _prev: ProductActionState | undefined,
  formData: FormData,
): Promise<ProductActionState> {
  const supabase = await createClient();
  const base = baseProductoSchema.safeParse({
    codigo: String(formData.get("codigo") ?? "").trim().toUpperCase(),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    linea_id: formData.get("linea_id"),
    material_id: formData.get("material_id"),
    estado: String(formData.get("estado") ?? "activo"),
  });
  if (!base.success) return { error: base.error.issues[0]?.message ?? "Datos inválidos" };

  const { data: linea, error: lineaError } = await supabase
    .from("linea_produccion")
    .select("id,nombre")
    .eq("id", base.data.linea_id)
    .single();
  if (lineaError || !linea) return { error: "No se encontró la línea seleccionada." };

  const { data: producto, error: productoError } = await supabase
    .from("producto")
    .insert({
      codigo: base.data.codigo,
      descripcion: base.data.descripcion,
      linea_id: base.data.linea_id,
      material_id: base.data.material_id,
      estado: base.data.estado,
    })
    .select("id")
    .single();
  if (productoError || !producto) return { error: productoError?.message ?? "No se pudo crear el producto" };

  const lineName = linea.nombre.toLowerCase();
  if (lineName.includes("inye")) {
    const espec = pickEspecInyeccion(formData);
    const { error } = await supabase.from("espec_inyeccion").insert({
      producto_id: producto.id,
      ...espec,
    });
    if (error) return { error: error.message };
  } else {
    const espec = pickEspecSoplado(formData);
    const { error } = await supabase.from("espec_soplado").insert({
      producto_id: producto.id,
      ...espec,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/productos");
  return { success: "Producto creado correctamente." };
}
