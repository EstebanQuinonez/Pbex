"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { insertDefectEvent, insertProductionEvent } from "@/services/eventService";

const productionSchema = z.object({
  linea_produccion: z.string().min(1, "Indica la línea"),
  turno: z.string().min(1, "Indica el turno"),
  produccion_total: z.coerce.number().positive("Debe ser mayor que 0"),
  porcentaje_desperdicio: z.coerce
    .number()
    .min(0, "No puede ser negativo")
    .max(100, "No puede superar 100%"),
});

const defectSchema = z.object({
  nombre_maquina: z.string().min(1, "Indica la máquina"),
  tipo_defecto: z.string().min(1, "Indica el tipo de defecto"),
  cantidad: z.coerce.number().int().positive("Debe ser al menos 1"),
});

export type ActionState = { error?: string; success?: string };

export async function submitProduction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const parsed = productionSchema.safeParse({
    linea_produccion: formData.get("linea_produccion"),
    turno: formData.get("turno"),
    produccion_total: formData.get("produccion_total"),
    porcentaje_desperdicio: formData.get("porcentaje_desperdicio"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { error } = await insertProductionEvent(supabase, user.id, parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/registro");
  return { success: "Producción registrada (evento PRODUCTION_RECORDED)." };
}

export async function submitDefect(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const parsed = defectSchema.safeParse({
    nombre_maquina: formData.get("nombre_maquina"),
    tipo_defecto: formData.get("tipo_defecto"),
    cantidad: formData.get("cantidad"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { error } = await insertDefectEvent(supabase, user.id, parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/registro");
  return { success: "Defecto registrado (evento DEFECT_RECORDED)." };
}
