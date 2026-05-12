import type { SupabaseClient } from "@supabase/supabase-js";
import type { DefectPayload, EventType } from "@/lib/types/events";

const SCHEMA_META = { schema_version: 1 as const };

export type ProductionEventInput = {
  producto_id: number;
  maquina_id: number;
  turno: "A" | "B";
  cantidad: number;
  encargado_id: number;
  operario_id: number;
};

export type MermaEventInput = {
  /** Evento PRODUCTION_RECORDED al que descuenta esta merma. */
  produccion_evento_id: string;
  producto_id: number;
  maquina_id: number;
  turno: "A" | "B";
  merma: number;
  /** Clasificación de la merma (columna `defecto`, mismo dominio que DEFECT_RECORDED). */
  defecto: string;
};

export type MermaLineInput = {
  merma: number;
  defecto: string;
};

export type OrderCreatedEventInput = {
  pedido_id: number;
  cliente_id: number;
  producto_id: number;
  vendedor_id: number;
  cantidad: number;
};

export type OrderCompletedEventInput = {
  pedido_id: number;
  cliente_id: number;
  producto_id: number;
  vendedor_id: number;
  cantidad: number;
};

export async function insertProductionEvent(
  supabase: SupabaseClient,
  userId: string,
  input: ProductionEventInput,
) {
  return supabase.from("eventos").insert({
    user_id: userId,
    type: "PRODUCTION_RECORDED" satisfies EventType,
    producto_id: input.producto_id,
    maquina_id: input.maquina_id,
    turno: input.turno,
    cantidad: input.cantidad,
    encargado_id: input.encargado_id,
    operario_id: input.operario_id,
    payload: SCHEMA_META,
  });
}

export async function insertMermaEvent(supabase: SupabaseClient, userId: string, input: MermaEventInput) {
  const { merma, defecto, ...shared } = input;
  return insertMermaEvents(supabase, userId, shared, [{ merma, defecto }]);
}

/** Una o varias filas MERMA_RECORDED para la misma producción (inserción atómica en un solo INSERT). */
export async function insertMermaEvents(
  supabase: SupabaseClient,
  userId: string,
  shared: Omit<MermaEventInput, "merma" | "defecto">,
  lines: MermaLineInput[],
) {
  if (lines.length === 0) {
    return { data: null, error: { message: "No hay líneas de merma." } as { message: string } };
  }
  const rows = lines.map((line) => ({
    user_id: userId,
    type: "MERMA_RECORDED" satisfies EventType,
    produccion_evento_id: shared.produccion_evento_id,
    producto_id: shared.producto_id,
    maquina_id: shared.maquina_id,
    turno: shared.turno,
    merma: line.merma,
    defecto: line.defecto,
    payload: SCHEMA_META,
  }));
  return supabase.from("eventos").insert(rows);
}

export type MachineDefectEventInput = {
  maquina_id: number;
  /** Debe existir en `fallas_maquina.nombre` (FK en `eventos.falla_maquina`). */
  falla_maquina: string;
  cantidad: number;
  /** ISO 8601 (UTC recomendado desde el cliente). */
  falla_ocurrida_at: string;
  /** Etiquetas legibles para payload / analíticas legadas. */
  nombre_maquina_label: string;
};

export async function insertDefectEvent(
  supabase: SupabaseClient,
  userId: string,
  input: MachineDefectEventInput,
) {
  const payload: DefectPayload = {
    nombre_maquina: input.nombre_maquina_label,
    tipo_defecto: input.falla_maquina,
    cantidad: input.cantidad,
  };
  return supabase.from("eventos").insert({
    user_id: userId,
    type: "DEFECT_RECORDED" satisfies EventType,
    maquina_id: input.maquina_id,
    cantidad: input.cantidad,
    falla_maquina: input.falla_maquina,
    falla_ocurrida_at: input.falla_ocurrida_at,
    falla_resuelta: false,
    payload: { ...SCHEMA_META, ...payload },
  });
}

export async function insertOrderCreatedEvent(
  supabase: SupabaseClient,
  userId: string,
  input: OrderCreatedEventInput,
) {
  return supabase.from("eventos").insert({
    user_id: userId,
    type: "ORDER_CREATED" satisfies EventType,
    pedido_id: input.pedido_id,
    cliente_id: input.cliente_id,
    producto_id: input.producto_id,
    vendedor_id: input.vendedor_id,
    cantidad: input.cantidad,
    payload: SCHEMA_META,
  });
}

export async function insertOrderCompletedEvent(
  supabase: SupabaseClient,
  userId: string,
  input: OrderCompletedEventInput,
) {
  return supabase.from("eventos").insert({
    user_id: userId,
    type: "ORDER_COMPLETED" satisfies EventType,
    pedido_id: input.pedido_id,
    cliente_id: input.cliente_id,
    producto_id: input.producto_id,
    vendedor_id: input.vendedor_id,
    cantidad: input.cantidad,
    payload: SCHEMA_META,
  });
}
