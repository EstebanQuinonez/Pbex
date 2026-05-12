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

const initial: PedidoActionState = {};

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
      <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nuevo pedido</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Crea la fila en <code className="text-xs">pedidos</code> y el evento <code className="text-xs">ORDER_CREATED</code>.
        </p>
        <form action={createAction} className="mt-4 grid max-w-lg gap-4">
          <Field label="Cliente" htmlFor="cliente_id">
            <select
              id="cliente_id"
              name="cliente_id"
              required
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
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
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
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
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
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
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{createState.success}</p>
          ) : null}
          <button
            type="submit"
            disabled={createPending}
            className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {createPending ? "Creando…" : "Crear pedido"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Pedidos recientes</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Completar genera <code className="text-xs">ORDER_COMPLETED</code> y deja el pedido en estado COMPLETADO.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 font-medium">Cant.</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const cli = emb(p.cliente);
                const prod = emb(p.producto);
                const puedeCompletar = p.estado !== "COMPLETADO";
                return (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2">{p.id}</td>
                    <td className="px-3 py-2">{cli?.nombre ?? "—"}</td>
                    <td className="px-3 py-2">
                      {prod ? `${prod.codigo} — ${prod.descripcion}` : "—"}
                    </td>
                    <td className="px-3 py-2">{p.cantidad}</td>
                    <td className="px-3 py-2">{p.estado}</td>
                    <td className="px-3 py-2 text-zinc-500">{new Date(p.fecha_pedido).toLocaleString("es")}</td>
                    <td className="px-3 py-2">
                      {puedeCompletar ? (
                        <form action={completeAction}>
                          <input type="hidden" name="pedido_id" value={p.id} />
                          <button
                            type="submit"
                            disabled={completePending}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                          >
                            Completar
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
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{completeState.error}</p>
        ) : null}
        {completeState?.success ? (
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{completeState.success}</p>
        ) : null}
      </section>
    </div>
  );
}
