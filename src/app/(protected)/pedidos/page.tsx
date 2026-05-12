import { createClient } from "@/lib/supabase/server";
import { PedidosPanel, type PedidoListRow } from "@/components/pedidos/PedidosPanel";

export default async function PedidosPage() {
  const supabase = await createClient();

  const [{ data: clientes }, { data: vendedores }, { data: productos }, { data: pedidosRaw }] = await Promise.all([
    supabase.from("clientes").select("id,nombre").order("nombre"),
    supabase.from("vendedores").select("id,nombre").eq("estado", "activo").order("nombre"),
    supabase.from("producto").select("id,codigo,descripcion").eq("estado", "activo").order("codigo"),
    supabase
      .from("pedidos")
      .select(
        "id,estado,cantidad,fecha_pedido,cliente:clientes(nombre),producto:producto(codigo,descripcion),vendedor:vendedores(nombre)",
      )
      .order("fecha_pedido", { ascending: false })
      .limit(80),
  ]);

  const pedidos = (pedidosRaw ?? []) as PedidoListRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Pedidos</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Rol VENTAS o ADMIN. Los eventos de pedido usan columnas <code className="text-xs">pedido_id</code>,{" "}
          <code className="text-xs">cliente_id</code>, <code className="text-xs">producto_id</code> y{" "}
          <code className="text-xs">vendedor_id</code>.
        </p>
      </div>
      <PedidosPanel
        clientes={clientes ?? []}
        vendedores={vendedores ?? []}
        productos={productos ?? []}
        pedidos={pedidos}
      />
    </div>
  );
}
