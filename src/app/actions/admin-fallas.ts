"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parseAppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { FallaMaquinaReporteRow } from "@/lib/types/admin-fallas";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || parseAppRole(user) !== "ADMIN") {
    throw new Error("Solo administradores pueden usar esta acción.");
  }
  return { supabase, user };
}

export async function listFallasMaquinaReportes(): Promise<
  { ok: true; rows: FallaMaquinaReporteRow[] } | { ok: false; error: string }
> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("eventos")
      .select(
        `id, timestamp, cantidad, falla_maquina, falla_ocurrida_at, falla_resuelta, maquina_id, maquinas ( codigo, nombre )`,
      )
      .eq("type", "DEFECT_RECORDED")
      .not("falla_maquina", "is", null)
      .order("timestamp", { ascending: false })
      .limit(200);

    if (error) return { ok: false, error: error.message };

    const rows: FallaMaquinaReporteRow[] = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const rawMaq = r.maquinas;
      const maquinas =
        rawMaq == null
          ? null
          : Array.isArray(rawMaq)
            ? (rawMaq[0] as { codigo: string; nombre: string } | undefined) ?? null
            : (rawMaq as { codigo: string; nombre: string });
      return {
        id: String(r.id),
        timestamp: String(r.timestamp),
        cantidad: r.cantidad != null ? Number(r.cantidad) : null,
        falla_maquina: r.falla_maquina != null ? String(r.falla_maquina) : null,
        falla_ocurrida_at: r.falla_ocurrida_at != null ? String(r.falla_ocurrida_at) : null,
        falla_resuelta: Boolean(r.falla_resuelta),
        maquina_id: r.maquina_id != null ? Number(r.maquina_id) : null,
        maquinas,
      };
    });

    return { ok: true, rows };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al cargar reportes";
    return { ok: false, error: message };
  }
}

export type FallaResueltaActionState = { error?: string; success?: string };

const toggleSchema = z.object({
  evento_id: z.string().uuid("Identificador inválido"),
  resuelta: z.enum(["true", "false"]),
});

export async function setFallaMaquinaResuelta(
  _prev: FallaResueltaActionState | undefined,
  formData: FormData,
): Promise<FallaResueltaActionState> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = toggleSchema.safeParse({
      evento_id: formData.get("evento_id"),
      resuelta: formData.get("resuelta"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const resuelta = parsed.data.resuelta === "true";
    const { error } = await supabase
      .from("eventos")
      .update({ falla_resuelta: resuelta })
      .eq("id", parsed.data.evento_id)
      .eq("type", "DEFECT_RECORDED");
    if (error) return { error: error.message };
    revalidatePath("/admin/fallas");
    return { success: resuelta ? "Marcado como resuelto." : "Marcado como pendiente." };
  } catch (e) {
    const message = e instanceof Error ? e.message : "No autorizado";
    return { error: message };
  }
}
