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

const inyeccionSchema = z.object({
  peso_g_nominal: z.coerce.number().optional(),
  peso_g_tolerancia: z.coerce.number().optional(),
  diam_exterior_mm_nominal: z.coerce.number().optional(),
  diam_exterior_mm_tolerancia: z.coerce.number().optional(),
  diam_interior_mm_nominal: z.coerce.number().optional(),
  diam_interior_mm_tolerancia: z.coerce.number().optional(),
  alto_largo_mm_nominal: z.coerce.number().optional(),
  alto_largo_mm_tolerancia: z.coerce.number().optional(),
  ancho_mm_nominal: z.coerce.number().optional(),
  ancho_mm_tolerancia: z.coerce.number().optional(),
  espesor_pared_mm_nominal: z.coerce.number().optional(),
  espesor_pared_mm_tolerancia: z.coerce.number().optional(),
  espesor_preco_mm_nominal: z.coerce.number().optional(),
  espesor_preco_mm_tolerancia: z.coerce.number().optional(),
  diam_ext_sin_hilo_mm_nominal: z.coerce.number().optional(),
  diam_ext_sin_hilo_mm_tolerancia: z.coerce.number().optional(),
});

const sopladoSchema = z.object({
  peso_g: z.coerce.number().optional(),
  peso_tolerancia: z.coerce.number().optional(),
  diam_ext_boca_mm: z.coerce.number().optional(),
  diam_ext_cuello_mm: z.coerce.number().optional(),
  diam_int_cuello_mm: z.coerce.number().optional(),
  altura_boca_mm: z.coerce.number().optional(),
});

function maybeNumber(value: FormDataEntryValue | null) {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  const n = Number(text);
  return Number.isFinite(n) ? n : undefined;
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
    const parsedIny = inyeccionSchema.safeParse({
      peso_g_nominal: maybeNumber(formData.get("peso_g_nominal")),
      peso_g_tolerancia: maybeNumber(formData.get("peso_g_tolerancia")),
      diam_exterior_mm_nominal: maybeNumber(formData.get("diam_exterior_mm_nominal")),
      diam_exterior_mm_tolerancia: maybeNumber(formData.get("diam_exterior_mm_tolerancia")),
      diam_interior_mm_nominal: maybeNumber(formData.get("diam_interior_mm_nominal")),
      diam_interior_mm_tolerancia: maybeNumber(formData.get("diam_interior_mm_tolerancia")),
      alto_largo_mm_nominal: maybeNumber(formData.get("alto_largo_mm_nominal")),
      alto_largo_mm_tolerancia: maybeNumber(formData.get("alto_largo_mm_tolerancia")),
      ancho_mm_nominal: maybeNumber(formData.get("ancho_mm_nominal")),
      ancho_mm_tolerancia: maybeNumber(formData.get("ancho_mm_tolerancia")),
      espesor_pared_mm_nominal: maybeNumber(formData.get("espesor_pared_mm_nominal")),
      espesor_pared_mm_tolerancia: maybeNumber(formData.get("espesor_pared_mm_tolerancia")),
      espesor_preco_mm_nominal: maybeNumber(formData.get("espesor_preco_mm_nominal")),
      espesor_preco_mm_tolerancia: maybeNumber(formData.get("espesor_preco_mm_tolerancia")),
      diam_ext_sin_hilo_mm_nominal: maybeNumber(formData.get("diam_ext_sin_hilo_mm_nominal")),
      diam_ext_sin_hilo_mm_tolerancia: maybeNumber(formData.get("diam_ext_sin_hilo_mm_tolerancia")),
    });
    if (!parsedIny.success) return { error: parsedIny.error.issues[0]?.message ?? "Especificación inyección inválida" };

    const { error } = await supabase.from("espec_inyeccion").insert({
      producto_id: producto.id,
      ...parsedIny.data,
    });
    if (error) return { error: error.message };
  } else {
    const parsedSop = sopladoSchema.safeParse({
      peso_g: maybeNumber(formData.get("peso_g")),
      peso_tolerancia: maybeNumber(formData.get("peso_tolerancia")),
      diam_ext_boca_mm: maybeNumber(formData.get("diam_ext_boca_mm")),
      diam_ext_cuello_mm: maybeNumber(formData.get("diam_ext_cuello_mm")),
      diam_int_cuello_mm: maybeNumber(formData.get("diam_int_cuello_mm")),
      altura_boca_mm: maybeNumber(formData.get("altura_boca_mm")),
    });
    if (!parsedSop.success) return { error: parsedSop.error.issues[0]?.message ?? "Especificación soplado inválida" };

    const { error } = await supabase.from("espec_soplado").insert({
      producto_id: producto.id,
      ...parsedSop.data,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/productos");
  return { success: "Producto creado correctamente." };
}
