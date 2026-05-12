"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseAppRole } from "@/lib/auth/roles";
import { canManagePedidoEvents } from "@/lib/auth/action-roles";
import { insertOrderCompletedEvent, insertOrderCreatedEvent } from "@/services/eventService";

export type PedidoActionState = { error?: string; success?: string };

const crearPedidoSchema = z.object({
  cliente_id: z.coerce.number().int().positive(),
  producto_id: z.coerce.number().int().positive(),
  vendedor_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive(),
  fecha_entrega: z.string().optional(),
});

export async function crearPedidoConEvento(
  _prev: PedidoActionState | undefined,
  formData: FormData,
): Promise<PedidoActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (!canManagePedidoEvents(parseAppRole(user))) {
    return { error: "No tienes permiso para crear pedidos." };
  }

  const rawFecha = String(formData.get("fecha_entrega") ?? "").trim();
  const parsed = crearPedidoSchema.safeParse({
    cliente_id: formData.get("cliente_id"),
    producto_id: formData.get("producto_id"),
    vendedor_id: formData.get("vendedor_id"),
    cantidad: formData.get("cantidad"),
    fecha_entrega: rawFecha === "" ? undefined : rawFecha,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { cliente_id, producto_id, vendedor_id, cantidad, fecha_entrega } = parsed.data;

  const { data: pedido, error: insErr } = await supabase
    .from("pedidos")
    .insert({
      cliente_id,
      producto_id,
      vendedor_id,
      cantidad,
      estado: "PENDIENTE",
      fecha_entrega: fecha_entrega ?? null,
    })
    .select("id")
    .single();

  if (insErr || !pedido) {
    return { error: insErr?.message ?? "No se pudo crear el pedido." };
  }

  const { error: evErr } = await insertOrderCreatedEvent(supabase, user.id, {
    pedido_id: pedido.id,
    cliente_id,
    producto_id,
    vendedor_id,
    cantidad,
  });
  if (evErr) {
    return { error: `Pedido creado pero falló el evento ORDER_CREATED: ${evErr.message}` };
  }

  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  return { success: "Pedido creado y evento ORDER_CREATED registrado." };
}

const completarSchema = z.object({
  pedido_id: z.coerce.number().int().positive(),
});

export async function completarPedidoConEvento(
  _prev: PedidoActionState | undefined,
  formData: FormData,
): Promise<PedidoActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  if (!canManagePedidoEvents(parseAppRole(user))) {
    return { error: "No tienes permiso para cerrar pedidos." };
  }

  const parsed = completarSchema.safeParse({ pedido_id: formData.get("pedido_id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Pedido inválido" };
  }

  const { data: pedido, error: getErr } = await supabase
    .from("pedidos")
    .select("id,estado,cliente_id,producto_id,vendedor_id,cantidad")
    .eq("id", parsed.data.pedido_id)
    .maybeSingle();

  if (getErr || !pedido) return { error: "Pedido no encontrado." };
  if (pedido.estado === "COMPLETADO") return { error: "El pedido ya está completado." };

  const { error: upErr } = await supabase.from("pedidos").update({ estado: "COMPLETADO" }).eq("id", pedido.id);
  if (upErr) return { error: upErr.message };

  const { error: evErr } = await insertOrderCompletedEvent(supabase, user.id, {
    pedido_id: pedido.id,
    cliente_id: pedido.cliente_id,
    producto_id: pedido.producto_id,
    vendedor_id: pedido.vendedor_id,
    cantidad: pedido.cantidad,
  });
  if (evErr) {
    return { error: `Estado actualizado pero falló ORDER_COMPLETED: ${evErr.message}` };
  }

  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  return { success: "Pedido completado (ORDER_COMPLETED)." };
}
