import type { SupabaseClient } from "@supabase/supabase-js";
import type { DefectPayload, EventType, ProductionPayload } from "@/lib/types/events";

export async function insertProductionEvent(
  supabase: SupabaseClient,
  userId: string,
  payload: ProductionPayload,
) {
  return supabase.from("eventos").insert({
    user_id: userId,
    tipo: "PRODUCTION_RECORDED" satisfies EventType,
    payload,
  });
}

export async function insertDefectEvent(
  supabase: SupabaseClient,
  userId: string,
  payload: DefectPayload,
) {
  return supabase.from("eventos").insert({
    user_id: userId,
    tipo: "DEFECT_RECORDED" satisfies EventType,
    payload,
  });
}
