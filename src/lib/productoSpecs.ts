import type { ProductoCard } from "@/lib/types/productos";

/** Escapa \, % y _ del texto buscado para tratarlos como caracteres literales dentro de ilike. */
export function escapeIlikeLiteral(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Patrón ilike “contiene en cualquier parte” (case-insensitive vía ilike). */
export function ilikeContainsPattern(text: string): string {
  return `%${escapeIlikeLiteral(text)}%`;
}

const ETIQUETAS_INYECCION: Record<string, string> = {
  peso_g_nominal: "Peso nominal (g)",
  peso_g_tolerancia: "Peso tolerancia (g)",
  diam_exterior_mm_nominal: "Diám. exterior nominal (mm)",
  diam_exterior_mm_tolerancia: "Diám. exterior tolerancia (mm)",
  diam_interior_mm_nominal: "Diám. interior nominal (mm)",
  diam_interior_mm_tolerancia: "Diám. interior tolerancia (mm)",
  alto_largo_mm_nominal: "Alto / largo nominal (mm)",
  alto_largo_mm_tolerancia: "Alto / largo tolerancia (mm)",
  ancho_mm_nominal: "Ancho nominal (mm)",
  ancho_mm_tolerancia: "Ancho tolerancia (mm)",
  espesor_pared_mm_nominal: "Espesor pared nominal (mm)",
  espesor_pared_mm_tolerancia: "Espesor pared tolerancia (mm)",
  espesor_preco_mm_nominal: "Espesor preco nominal (mm)",
  espesor_preco_mm_tolerancia: "Espesor preco tolerancia (mm)",
  diam_ext_sin_hilo_mm_nominal: "Diám. ext. sin hilo nominal (mm)",
  diam_ext_sin_hilo_mm_tolerancia: "Diám. ext. sin hilo tolerancia (mm)",
};

const ETIQUETAS_SOPLADO: Record<string, string> = {
  peso_g: "Peso (g)",
  peso_tolerancia: "Peso tolerancia (g)",
  diam_ext_boca_mm: "Diám. exterior boca (mm)",
  diam_ext_cuello_mm: "Diám. exterior cuello (mm)",
  diam_int_cuello_mm: "Diám. interior cuello (mm)",
  altura_boca_mm: "Altura boca (mm)",
};

const SKIP_KEYS = new Set(["id", "producto_id"]);

/**
 * Normaliza valores que vienen de PostgreSQL numeric / bigint / number / string.
 * PostgREST suele devolver numeric como string en JSON.
 */
export function formatValor(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return trimNumericString(String(v));
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    if (/^-?\d+(\.\d+)?$/.test(t)) return trimNumericString(t);
    return t;
  }
  return null;
}

function trimNumericString(s: string): string {
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "").replace(/\.$/, "") || "0";
}

function countFilledSpecFields(spec: Record<string, unknown> | null | undefined): number {
  if (!spec || typeof spec !== "object") return 0;
  let n = 0;
  for (const [k, v] of Object.entries(spec)) {
    if (SKIP_KEYS.has(k)) continue;
    if (formatValor(v) !== null) n++;
  }
  return n;
}

/** Elige qué bloque de especificación usar para vista previa cuando hay datos en una o ambas tablas. */
export function resolveSpecKind(p: ProductoCard): "inyeccion" | "soplado" | null {
  const ci = countFilledSpecFields(p.espec_inyeccion as Record<string, unknown> | null);
  const cs = countFilledSpecFields(p.espec_soplado as Record<string, unknown> | null);
  if (ci === 0 && cs === 0) return null;
  if (ci > 0 && cs === 0) return "inyeccion";
  if (cs > 0 && ci === 0) return "soplado";
  const linea = p.linea?.nombre?.toLowerCase() ?? "";
  if (linea.includes("inye")) return "inyeccion";
  if (linea.includes("sop")) return "soplado";
  return ci >= cs ? "inyeccion" : "soplado";
}

export function getPreviewPesoDiametro(p: ProductoCard): { peso: string; diametro: string } {
  const kind = resolveSpecKind(p);
  if (kind === "inyeccion" && p.espec_inyeccion) {
    const e = p.espec_inyeccion;
    const peso = formatValor(e.peso_g_nominal);
    const diam =
      formatValor(e.diam_exterior_mm_nominal) ??
      formatValor(e.diam_interior_mm_nominal) ??
      formatValor(e.diam_ext_sin_hilo_mm_nominal);
    return {
      peso: peso ? `${peso} g` : "—",
      diametro: diam ? `${diam} mm` : "—",
    };
  }
  if (kind === "soplado" && p.espec_soplado) {
    const e = p.espec_soplado;
    const peso = formatValor(e.peso_g);
    const diam = formatValor(e.diam_ext_boca_mm) ?? formatValor(e.diam_ext_cuello_mm);
    return {
      peso: peso ? `${peso} g` : "—",
      diametro: diam ? `${diam} mm` : "—",
    };
  }
  return { peso: "—", diametro: "—" };
}

export type EntradaDetalle = { clave: string; etiqueta: string; valor: string };

export type DetalleSeccion = { titulo: string; filas: EntradaDetalle[] };

function filasDesdeSpec(
  spec: Record<string, unknown> | null | undefined,
  etiquetas: Record<string, string>,
): EntradaDetalle[] {
  if (!spec || typeof spec !== "object") return [];
  const out: EntradaDetalle[] = [];
  for (const [k, v] of Object.entries(spec)) {
    if (SKIP_KEYS.has(k)) continue;
    const val = formatValor(v);
    if (val === null) continue;
    out.push({ clave: k, etiqueta: etiquetas[k] ?? k, valor: val });
  }
  return out;
}

/** Una o dos secciones: solo filas con valor en BD. */
export function getDetallesSecciones(p: ProductoCard): DetalleSeccion[] {
  const secciones: DetalleSeccion[] = [];
  const iny = filasDesdeSpec(p.espec_inyeccion as Record<string, unknown> | null, ETIQUETAS_INYECCION);
  const sop = filasDesdeSpec(p.espec_soplado as Record<string, unknown> | null, ETIQUETAS_SOPLADO);
  if (iny.length) secciones.push({ titulo: "Inyección", filas: iny });
  if (sop.length) secciones.push({ titulo: "Soplado", filas: sop });
  return secciones;
}
