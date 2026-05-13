"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  completarPedidoConEvento,
  crearPedidoConEvento,
  type PedidoActionState,
} from "@/app/actions/pedidos";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

type ClienteOpt = { id: number; nombre: string };
type VendedorOpt = { id: number; nombre: string };
type ProductoOpt = { id: number; codigo: string; descripcion: string };

export type PedidoListRow = {
  id: number;
  estado: string;
  cantidad: number;
  fecha_pedido: string;
  cliente: { nombre: string } | { nombre: string }[] | null;
  producto: { codigo: string; descripcion: string } | { codigo: string; descripcion: string }[] | null;
  vendedor: { nombre: string } | { nombre: string }[] | null;
};

function emb<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function estadoUi(estado: string): { label: string; variant: "done" | "pending" | "progress" } {
  if (estado === "COMPLETADO") return { label: "Completado", variant: "done" };
  if (estado === "EN_PROCESO") return { label: "En proceso", variant: "progress" };
  if (estado === "PENDIENTE") return { label: "Pendiente", variant: "pending" };
  return { label: estado, variant: "pending" };
}

const initial: PedidoActionState = {};

const cardClass =
  "rounded-2xl border border-[var(--pbex-border)] bg-gradient-to-b from-[var(--pbex-surface)]/70 to-white p-6 shadow-sm dark:border-zinc-700/80 dark:from-zinc-900/50 dark:to-zinc-950";

export function PedidosPanel({
  clientes,
  vendedores,
  productos,
  pedidos,
}: {
  clientes: ClienteOpt[];
  vendedores: VendedorOpt[];
  productos: ProductoOpt[];
  pedidos: PedidoListRow[];
}) {
  const router = useRouter();
  const [createState, createAction, createPending] = useActionState(crearPedidoConEvento, initial);
  const [completeState, completeAction, completePending] = useActionState(completarPedidoConEvento, initial);

  useEffect(() => {
    if (createState?.success || completeState?.success) {
      router.refresh();
    }
  }, [createState?.success, completeState?.success, router]);

  return (
    <div className="flex flex-col gap-10">
      <section className={cardClass}>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Nuevo pedido</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Completa los datos del pedido. Quedará registrado y visible en el listado inferior.
        </p>
        <form action={createAction} className="mt-5 grid max-w-lg gap-4">
          <Field label="Cliente" htmlFor="cliente_id">
            <select
              id="cliente_id"
              name="cliente_id"
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:border-sky-400"
            >
              <option value="">Selecciona…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Producto" htmlFor="pedido-producto_id">
            <select
              id="pedido-producto_id"
              name="producto_id"
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:border-sky-400"
            >
              <option value="">Selecciona…</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.descripcion}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vendedor" htmlFor="vendedor_id">
            <select
              id="vendedor_id"
              name="vendedor_id"
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:border-sky-400"
            >
              <option value="">Selecciona…</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad" htmlFor="pedido-cantidad">
            <Input id="pedido-cantidad" name="cantidad" type="number" min={1} step={1} required />
          </Field>
          <Field label="Fecha entrega (opcional)" htmlFor="fecha_entrega">
            <Input id="fecha_entrega" name="fecha_entrega" type="date" />
          </Field>
          {createState?.error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{createState.error}</p>
          ) : null}
          {createState?.success ? (
            <p className="rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-sm font-medium text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
              {createState.success}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={createPending}
            className="w-fit rounded-lg bg-gradient-to-r from-[#0a2540] to-[#124771] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 dark:from-[#1e3a5f] dark:to-[#2563a8]"
          >
            {createPending ? "Creando…" : "Crear pedido"}
          </button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Pedidos recientes</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Los pedidos pendientes pueden marcarse como completados cuando la entrega esté cerrada.
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200/90 bg-white/50 dark:border-zinc-700/80 dark:bg-zinc-950/30">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-[var(--pbex-surface)]/80 dark:border-zinc-700 dark:bg-zinc-900/60">
              <tr>
                <th className="px-3 py-2.5 font-medium text-zinc-700 dark:text-zinc-300">ID</th>
                <th className="px-3 py-2.5 font-medium text-zinc-700 dark:text-zinc-300">Cliente</th>
                <th className="px-3 py-2.5 font-medium text-zinc-700 dark:text-zinc-300">Producto</th>
                <th className="px-3 py-2.5 font-medium text-zinc-700 dark:text-zinc-300">Cant.</th>
                <th className="px-3 py-2.5 font-medium text-zinc-700 dark:text-zinc-300">Estado</th>
                <th className="px-3 py-2.5 font-medium text-zinc-700 dark:text-zinc-300">Fecha</th>
                <th className="px-3 py-2.5 font-medium text-zinc-700 dark:text-zinc-300" />
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const cli = emb(p.cliente);
                const prod = emb(p.producto);
                const st = estadoUi(p.estado);
                const puedeCompletar = p.estado !== "COMPLETADO";
                return (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800/90">
                    <td className="px-3 py-2.5 tabular-nums text-zinc-800 dark:text-zinc-200">{p.id}</td>
                    <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">{cli?.nombre ?? "—"}</td>
                    <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">
                      {prod ? `${prod.codigo} — ${prod.descripcion}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-zinc-800 dark:text-zinc-200">{p.cantidad}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={
                          st.variant === "done"
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                            : st.variant === "progress"
                              ? "rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-950 dark:bg-sky-900/35 dark:text-sky-100"
                              : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950 dark:bg-amber-900/35 dark:text-amber-100"
                        }
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-zinc-600 dark:text-zinc-400">
                      {new Date(p.fecha_pedido).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-3 py-2.5">
                      {puedeCompletar ? (
                        <form action={completeAction} className="inline">
                          <input type="hidden" name="pedido_id" value={p.id} />
                          <button
                            type="submit"
                            disabled={completePending}
                            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-white disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            {completePending ? "…" : "Completar"}
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {completeState?.error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{completeState.error}</p>
        ) : null}
        {completeState?.success ? (
          <p className="mt-3 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-sm font-medium text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
            {completeState.success}
          </p>
        ) : null}
      </section>
    </div>
  );
}
