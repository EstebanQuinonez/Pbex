/** Cantidad bruta de un evento PRODUCTION_RECORDED (columna o payload legado). */
export function grossFromProductionRow(row: {
  cantidad?: number | string | null;
  payload?: unknown;
}): number {
  if (row.cantidad != null) {
    const c = Number(row.cantidad);
    if (Number.isFinite(c) && c > 0) return c;
  }
  const p = row.payload;
  if (p && typeof p === "object" && "produccion_total" in p) {
    const pt = (p as Record<string, unknown>).produccion_total;
    if (typeof pt === "number" && pt > 0) return pt;
    if (typeof pt === "string") {
      const n = Number(pt);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return 0;
}
