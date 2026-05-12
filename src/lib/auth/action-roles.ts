import type { AppRole } from "@/lib/auth/roles";

/** Producción / mermas en planta: encargado, gerente o admin. */
export function canRecordPlantEvents(role: AppRole | null): boolean {
  return role === "ENCARGADO_LINEA" || role === "GERENTE" || role === "ADMIN";
}

/** Alta y cierre de pedidos con eventos: ventas o admin. */
export function canManagePedidoEvents(role: AppRole | null): boolean {
  return role === "VENTAS" || role === "ADMIN";
}

/** Catálogo de productos (alta, edición, baja y líneas/materiales desde esa pantalla). */
export function canManageProductosCatalog(role: AppRole | null): boolean {
  return role === "ADMIN";
}
