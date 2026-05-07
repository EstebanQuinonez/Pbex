"use client";

import { deleteProducto } from "@/app/actions/productos";

export function DeleteProductButton({ productoId }: { productoId: number }) {
  return (
    <form action={deleteProducto} className="inline">
      <input type="hidden" name="producto_id" value={productoId} />
      <button
        type="submit"
        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/40"
        onClick={(e) => {
          if (!confirm("¿Eliminar este producto? Se borrarán también sus especificaciones. No se puede deshacer.")) {
            e.preventDefault();
          }
        }}
      >
        Eliminar
      </button>
    </form>
  );
}
