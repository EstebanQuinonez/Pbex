export default function PedidosPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Pedidos</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Vista para rol VENTAS o ADMIN. Conecta aquí el listado de <code className="text-xs">pedidos</code> en
        Supabase cuando lo implementes.
      </p>
    </div>
  );
}
