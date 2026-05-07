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

function formatValor(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim() !== "") return v.trim();
  return null;
}

export function getPreviewPesoDiametro(p: ProductoCard): { peso: string; diametro: string } {
  if (p.espec_inyeccion) {
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
  if (p.espec_soplado) {
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

export function getDetallesEspecificacion(p: ProductoCard): EntradaDetalle[] {
  const out: EntradaDetalle[] = [];
  if (p.espec_inyeccion) {
    for (const [k, v] of Object.entries(p.espec_inyeccion)) {
      if (SKIP_KEYS.has(k)) continue;
      const val = formatValor(v);
      if (val === null) continue;
      const etiqueta = ETIQUETAS_INYECCION[k] ?? k;
      out.push({ clave: k, etiqueta, valor: val });
    }
    return out;
  }
  if (p.espec_soplado) {
    for (const [k, v] of Object.entries(p.espec_soplado)) {
      if (SKIP_KEYS.has(k)) continue;
      const val = formatValor(v);
      if (val === null) continue;
      const etiqueta = ETIQUETAS_SOPLADO[k] ?? k;
      out.push({ clave: k, etiqueta, valor: val });
    }
    return out;
  }
  return [];
}
