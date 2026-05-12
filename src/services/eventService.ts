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
  producto_id: number;
  maquina_id: number;
  turno: "A" | "B";
  merma: number;
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
  return supabase.from("eventos").insert({
    user_id: userId,
    type: "MERMA_RECORDED" satisfies EventType,
    producto_id: input.producto_id,
    maquina_id: input.maquina_id,
    turno: input.turno,
    merma: input.merma,
    payload: SCHEMA_META,
  });
}

export async function insertDefectEvent(
  supabase: SupabaseClient,
  userId: string,
  payload: DefectPayload,
) {
  return supabase.from("eventos").insert({
    user_id: userId,
    type: "DEFECT_RECORDED" satisfies EventType,
    payload,
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
