"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  codigo: z.string().min(1, "Código requerido"),
  descripcion: z.string().min(1, "Descripción requerida"),
  linea_id: z.coerce.number().int().positive("Selecciona línea"),
  material_id: z.coerce.number().int().positive("Selecciona material"),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
});

const updateProductoSchema = baseProductoSchema.extend({
  producto_id: z.coerce.number().int().positive(),
});

export const CAMPOS_INYECCION = [
  "peso",
  "diam_exterior_mm",
  "diam_ext_sin_hilo_mm",
  "diam_interior_mm",
  "alto_largo_mm",
  "ancho_mm",
  "espesor_pared_mm",
  "espesor_preco_mm",
] as const;

export const CAMPOS_SOPLADO = [
  "peso",
  "diam_ext_boca_mm",
  "diam_ext_cuello_mm",
  "diam_int_cuello_mm",
  "altura_boca_mm",
] as const;

/** Solo campos con valor (alta): no obliga a llenar especificaciones. */
function maybeSpecText(value: FormDataEntryValue | null): string | undefined {
  if (value == null) return undefined;
  const t = String(value).trim();
  return t === "" ? undefined : t;
}

function pickEspecInyeccionCreate(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of CAMPOS_INYECCION) {
    const v = maybeSpecText(formData.get(k));
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function pickEspecSopladoCreate(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of CAMPOS_SOPLADO) {
    const v = maybeSpecText(formData.get(k));
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** Edición: incluye todas las claves; vacío en formulario → null en BD. */
function specValueForUpdate(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  return t === "" ? null : t;
}

function pickEspecInyeccionUpdate(formData: FormData): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const k of CAMPOS_INYECCION) {
    out[k] = specValueForUpdate(formData.get(k));
  }
  return out;
}

function pickEspecSopladoUpdate(formData: FormData): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const k of CAMPOS_SOPLADO) {
    out[k] = specValueForUpdate(formData.get(k));
  }
  return out;
}

function nullsForInyeccion(): Record<string, null> {
  const out: Record<string, null> = {};
  for (const k of CAMPOS_INYECCION) out[k] = null;
  return out;
}

function nullsForSoplado(): Record<string, null> {
  const out: Record<string, null> = {};
  for (const k of CAMPOS_SOPLADO) out[k] = null;
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
    const espec = pickEspecInyeccionCreate(formData);
    const { error } = await supabase.from("espec_inyeccion").insert({
      producto_id: producto.id,
      ...espec,
    });
    if (error) return { error: error.message };
  } else {
    const espec = pickEspecSopladoCreate(formData);
    const { error } = await supabase.from("espec_soplado").insert({
      producto_id: producto.id,
      ...espec,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/productos");
  return { success: "Producto creado correctamente." };
}

export async function updateProducto(
  _prev: ProductActionState | undefined,
  formData: FormData,
): Promise<ProductActionState> {
  const supabase = await createClient();
  const parsed = updateProductoSchema.safeParse({
    producto_id: formData.get("producto_id"),
    codigo: String(formData.get("codigo") ?? "").trim().toUpperCase(),
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    linea_id: formData.get("linea_id"),
    material_id: formData.get("material_id"),
    estado: String(formData.get("estado") ?? "activo"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { producto_id, ...base } = parsed.data;

  const { data: duplicado } = await supabase
    .from("producto")
    .select("id")
    .eq("codigo", base.codigo)
    .neq("id", producto_id)
    .maybeSingle();
  if (duplicado) return { error: "Ya existe otro producto con ese código." };

  const { data: linea, error: lineaError } = await supabase
    .from("linea_produccion")
    .select("id,nombre")
    .eq("id", base.linea_id)
    .single();
  if (lineaError || !linea) return { error: "No se encontró la línea seleccionada." };

  const { error: updErr } = await supabase
    .from("producto")
    .update({
      codigo: base.codigo,
      descripcion: base.descripcion,
      linea_id: base.linea_id,
      material_id: base.material_id,
      estado: base.estado,
    })
    .eq("id", producto_id);
  if (updErr) return { error: updErr.message };

  const lineName = linea.nombre.toLowerCase();
  if (lineName.includes("inye")) {
    const espec = pickEspecInyeccionUpdate(formData);
    const { error } = await supabase.from("espec_inyeccion").upsert({
      producto_id,
      ...espec,
    }, {
      onConflict: "producto_id",
    });
    if (error) return { error: error.message };

    // Limpia valores de la tabla opuesta sin depender de DELETE.
    await supabase
      .from("espec_soplado")
      .upsert({ producto_id, ...nullsForSoplado() }, { onConflict: "producto_id" });
  } else {
    const espec = pickEspecSopladoUpdate(formData);
    const { error } = await supabase.from("espec_soplado").upsert({
      producto_id,
      ...espec,
    }, {
      onConflict: "producto_id",
    });
    if (error) return { error: error.message };

    await supabase
      .from("espec_inyeccion")
      .upsert({ producto_id, ...nullsForInyeccion() }, { onConflict: "producto_id" });
  }

  revalidatePath("/productos");
  revalidatePath(`/productos/${producto_id}/edit`);
  redirect("/productos");
}

export async function deleteProducto(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("producto_id"));
  if (!Number.isFinite(id) || id <= 0) {
    redirect("/productos");
  }

  const { error } = await supabase.from("producto").delete().eq("id", id);
  if (error) redirect(`/productos?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/productos");
  redirect("/productos");
}
