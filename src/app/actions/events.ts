"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseAppRole } from "@/lib/auth/roles";
import { canRecordPlantEvents } from "@/lib/auth/action-roles";
import {
  insertDefectEvent,
  insertMermaEvent,
  insertProductionEvent,
} from "@/services/eventService";
import type { DefectPayload } from "@/lib/types/events";
import { grossFromProductionRow } from "@/lib/productionQuantities";

const turnoEnum = z.enum(["A", "B"]);

const productionStructuredSchema = z.object({
  producto_id: z.coerce.number().int().positive("Selecciona producto"),
  maquina_id: z.coerce.number().int().positive("Selecciona máquina"),
  turno: turnoEnum,
  cantidad: z.coerce.number().positive("Cantidad debe ser mayor que 0"),
  encargado_id: z.coerce.number().int().positive("Selecciona encargado"),
  operario_id: z.coerce.number().int().positive("Selecciona operario"),
});

const mermaSchema = z.object({
  produccion_evento_id: z.string().uuid("Selecciona la producción de referencia"),
  merma: z.coerce.number().positive("Merma debe ser mayor que 0"),
});

const defectSchema = z.object({
  nombre_maquina: z.string().min(1, "Indica la máquina"),
  tipo_defecto: z.string().min(1, "Indica el tipo de defecto"),
  cantidad: z.coerce.number().int().positive("Debe ser al menos 1"),
});

export type ActionState = { error?: string; success?: string };

async function validateProduccionCatalogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  p: z.infer<typeof productionStructuredSchema>,
): Promise<string | null> {
  const [{ data: prod, error: pe }, { data: maq, error: me }, { data: enc, error: ee }, { data: op, error: oe }] =
    await Promise.all([
      supabase.from("producto").select("linea_id").eq("id", p.producto_id).maybeSingle(),
      supabase.from("maquinas").select("linea_id").eq("id", p.maquina_id).maybeSingle(),
      supabase.from("encargados_linea").select("linea_id,turno").eq("id", p.encargado_id).maybeSingle(),
      supabase.from("operarios").select("turno").eq("id", p.operario_id).maybeSingle(),
    ]);
  if (pe || !prod) return "Producto no encontrado.";
  if (me || !maq) return "Máquina no encontrada.";
  if (ee || !enc) return "Encargado no encontrado.";
  if (oe || !op) return "Operario no encontrado.";
  if (prod.linea_id !== maq.linea_id) return "La máquina no pertenece a la línea del producto.";
  if (enc.linea_id !== prod.linea_id) return "El encargado no corresponde a la línea del producto.";
  if (enc.turno !== p.turno) return "El turno del encargado no coincide con el turno del registro.";
  if (op.turno !== p.turno) return "El turno del operario no coincide con el turno del registro.";
  return null;
}

export async function submitProduction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (!canRecordPlantEvents(parseAppRole(user))) {
    return { error: "No tienes permiso para registrar producción." };
  }

  const parsed = productionStructuredSchema.safeParse({
    producto_id: formData.get("producto_id"),
    maquina_id: formData.get("maquina_id"),
    turno: formData.get("turno"),
    cantidad: formData.get("cantidad"),
    encargado_id: formData.get("encargado_id"),
    operario_id: formData.get("operario_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const consistencia = await validateProduccionCatalogo(supabase, parsed.data);
  if (consistencia) return { error: consistencia };

  const { error } = await insertProductionEvent(supabase, user.id, parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/registro");
  return { success: "Producción registrada (PRODUCTION_RECORDED)." };
}

export async function submitMerma(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (!canRecordPlantEvents(parseAppRole(user))) {
    return { error: "No tienes permiso para registrar mermas." };
  }

  const parsed = mermaSchema.safeParse({
    produccion_evento_id: formData.get("produccion_evento_id"),
    merma: formData.get("merma"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { data: parent, error: pe } = await supabase
    .from("eventos")
    .select("id,type,producto_id,maquina_id,turno,cantidad,payload")
    .eq("id", parsed.data.produccion_evento_id)
    .maybeSingle();

  if (pe || !parent) return { error: "Producción de referencia no encontrada o sin acceso." };
  if (parent.type !== "PRODUCTION_RECORDED") {
    return { error: "El evento seleccionado no es una producción válida." };
  }

  const bruta = grossFromProductionRow(parent);
  if (bruta <= 0) return { error: "La producción seleccionada no tiene cantidad bruta registrada." };

  const pid = parent.producto_id != null ? Number(parent.producto_id) : NaN;
  const mid = parent.maquina_id != null ? Number(parent.maquina_id) : NaN;
  const turnoP = parent.turno === "A" || parent.turno === "B" ? parent.turno : null;
  if (!Number.isFinite(pid) || pid <= 0) return { error: "La producción no tiene producto enlazado." };
  if (!Number.isFinite(mid) || mid <= 0) return { error: "La producción no tiene máquina enlazada." };
  if (!turnoP) return { error: "La producción no tiene turno; no se puede registrar merma." };

  const [{ data: prod, error: perr }, { data: maq, error: merr }] = await Promise.all([
    supabase.from("producto").select("linea_id").eq("id", pid).maybeSingle(),
    supabase.from("maquinas").select("linea_id").eq("id", mid).maybeSingle(),
  ]);
  if (perr || !prod) return { error: "Producto de la producción no encontrado." };
  if (merr || !maq) return { error: "Máquina de la producción no encontrada." };
  if (prod.linea_id !== maq.linea_id) {
    return { error: "Inconsistencia línea producto/máquina en el evento de producción." };
  }

  const { data: mermasPrev, error: msumErr } = await supabase
    .from("eventos")
    .select("merma")
    .eq("type", "MERMA_RECORDED")
    .eq("produccion_evento_id", parent.id);

  if (msumErr) return { error: msumErr.message };

  const acumulada = (mermasPrev ?? []).reduce((acc, r) => acc + Number(r.merma ?? 0), 0);
  const disponible = bruta - acumulada;
  const eps = 1e-6;
  if (parsed.data.merma > disponible + eps) {
    return {
      error: `La merma (${parsed.data.merma}) supera lo disponible (${disponible.toFixed(4)}). Bruta: ${bruta}, ya registrado: ${acumulada}.`,
    };
  }

  const { error } = await insertMermaEvent(supabase, user.id, {
    produccion_evento_id: parsed.data.produccion_evento_id,
    producto_id: pid,
    maquina_id: mid,
    turno: turnoP,
    merma: parsed.data.merma,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/registro");
  return { success: "Merma registrada (MERMA_RECORDED)." };
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
  if (!canRecordPlantEvents(parseAppRole(user))) {
    return { error: "No tienes permiso para registrar defectos." };
  }

  const parsed = defectSchema.safeParse({
    nombre_maquina: formData.get("nombre_maquina"),
    tipo_defecto: formData.get("tipo_defecto"),
    cantidad: formData.get("cantidad"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { error } = await insertDefectEvent(supabase, user.id, parsed.data as DefectPayload);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/registro");
  return { success: "Defecto registrado (DEFECT_RECORDED)." };
}
