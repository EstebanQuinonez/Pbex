import { EVENT_TYPES } from "@/lib/types/events";
import type { DefectPayload, EventoRow, ProductionPayload } from "@/lib/types/events";

function isProductionPayload(p: unknown): p is ProductionPayload {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.linea_produccion === "string" &&
    typeof o.turno === "string" &&
    typeof o.produccion_total === "number" &&
    typeof o.porcentaje_desperdicio === "number"
  );
}

function isDefectPayload(p: unknown): p is DefectPayload {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.nombre_maquina === "string" &&
    typeof o.tipo_defecto === "string" &&
    typeof o.cantidad === "number"
  );
}

function productionCantidadFromRow(row: EventoRow): number | null {
  if (row.type !== EVENT_TYPES.PRODUCTION_RECORDED) return null;
  const c = row.cantidad;
  if (c != null && Number(c) > 0) return Number(c);
  if (isProductionPayload(row.payload)) return row.payload.produccion_total;
  return null;
}

export type ProductionMetrics = {
  registros: number;
  produccionTotal: number;
  mermaTotalUnidades: number;
  promedioDesperdicioPct: number;
  /** Eficiencia material aproximada: 100% − desperdicio medio (0–100). */
  eficienciaPct: number;
  alertasDesperdicioAlto: number;
};

export type DefectMetrics = {
  totalDefectos: number;
  porMaquina: Record<string, number>;
  porTipo: Record<string, number>;
  aumentoAnormal: boolean;
  ratioRecienteVsAnterior: number | null;
};

export type AnalyticsResult = {
  production: ProductionMetrics;
  defects: DefectMetrics;
};

const HIGH_WASTE_THRESHOLD = 5;
const DEFECT_SPIKE_RATIO = 1.6;
const MERMA_ALERTA_UNIDADES = 5;

function parseDefects(rows: EventoRow[]) {
  const defects: DefectPayload[] = [];
  for (const row of rows) {
    if (row.type === EVENT_TYPES.DEFECT_RECORDED && isDefectPayload(row.payload)) {
      defects.push(row.payload);
    }
  }
  return defects;
}

function defectTotalsByDay(rows: EventoRow[], start: Date, end: Date): number {
  let sum = 0;
  for (const row of rows) {
    if (row.type !== EVENT_TYPES.DEFECT_RECORDED || !isDefectPayload(row.payload)) continue;
    const d = new Date(row.timestamp);
    if (d >= start && d < end) sum += row.payload.cantidad;
  }
  return sum;
}

export function computeAnalytics(rows: EventoRow[]): AnalyticsResult {
  let produccionTotal = 0;
  let registrosProd = 0;
  const legacyWastes: number[] = [];
  let mermaTotal = 0;
  let alertasDesperdicioAlto = 0;

  for (const row of rows) {
    if (row.type === EVENT_TYPES.PRODUCTION_RECORDED) {
      const q = productionCantidadFromRow(row);
      if (q != null && q > 0) {
        produccionTotal += q;
        registrosProd += 1;
        if (isProductionPayload(row.payload)) {
          legacyWastes.push(row.payload.porcentaje_desperdicio);
          if (row.payload.porcentaje_desperdicio > HIGH_WASTE_THRESHOLD) {
            alertasDesperdicioAlto += 1;
          }
        }
      }
    }
    if (row.type === EVENT_TYPES.MERMA_RECORDED) {
      const m = row.merma != null ? Number(row.merma) : 0;
      if (m > 0) {
        mermaTotal += m;
        if (m >= MERMA_ALERTA_UNIDADES) alertasDesperdicioAlto += 1;
      }
    }
  }

  const promedioLegacy =
    legacyWastes.length > 0 ? legacyWastes.reduce((a, b) => a + b, 0) / legacyWastes.length : null;
  const pctMermaSobreProduccion =
    produccionTotal > 0 ? (mermaTotal / produccionTotal) * 100 : 0;
  const promedioDesperdicioPct =
    promedioLegacy != null ? promedioLegacy : pctMermaSobreProduccion;

  const eficienciaPct = Math.max(0, Math.min(100, 100 - promedioDesperdicioPct));

  const defects = parseDefects(rows);
  const porMaquina: Record<string, number> = {};
  const porTipo: Record<string, number> = {};
  let totalDefectos = 0;
  for (const d of defects) {
    totalDefectos += d.cantidad;
    porMaquina[d.nombre_maquina] = (porMaquina[d.nombre_maquina] ?? 0) + d.cantidad;
    porTipo[d.tipo_defecto] = (porTipo[d.tipo_defecto] ?? 0) + d.cantidad;
  }

  const now = new Date();
  const seven = 7 * 24 * 60 * 60 * 1000;
  const recentStart = new Date(now.getTime() - seven);
  const prevStart = new Date(now.getTime() - 2 * seven);
  const recent = defectTotalsByDay(rows, recentStart, now);
  const previous = defectTotalsByDay(rows, prevStart, recentStart);
  const ratioRecienteVsAnterior = previous > 0 ? recent / previous : recent > 0 ? null : null;
  const aumentoAnormal = previous > 0 && recent / previous >= DEFECT_SPIKE_RATIO && recent >= 3;

  return {
    production: {
      registros: registrosProd,
      produccionTotal,
      mermaTotalUnidades: mermaTotal,
      promedioDesperdicioPct,
      eficienciaPct,
      alertasDesperdicioAlto,
    },
    defects: {
      totalDefectos,
      porMaquina,
      porTipo,
      aumentoAnormal,
      ratioRecienteVsAnterior,
    },
  };
}

export function buildSummaryForGroq(analytics: AnalyticsResult): string {
  const p = analytics.production;
  const d = analytics.defects;
  const topMaquinas = Object.entries(d.porMaquina)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  const topTipos = Object.entries(d.porTipo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return [
    "Resumen de planta (últimos datos registrados):",
    `- Registros de producción: ${p.registros}, volumen total: ${p.produccionTotal}`,
    `- Merma total (eventos MERMA_RECORDED): ${p.mermaTotalUnidades}`,
    `- Desperdicio / merma indicador: ${p.promedioDesperdicioPct.toFixed(2)}%, eficiencia estimada: ${p.eficienciaPct.toFixed(2)}%`,
    `- Alertas (desperdicio legacy >5% o merma ≥${MERMA_ALERTA_UNIDADES} u.): ${p.alertasDesperdicioAlto}`,
    `- Defectos totales (unidades): ${d.totalDefectos}`,
    `- Aumento anormal de defectos (7d vs 7d previos): ${d.aumentoAnormal ? "sí" : "no"}${
      d.ratioRecienteVsAnterior != null ? `, ratio ${d.ratioRecienteVsAnterior.toFixed(2)}` : ""
    }`,
    topMaquinas ? `- Top máquinas por defectos: ${topMaquinas}` : "",
    topTipos ? `- Top tipos de defecto: ${topTipos}` : "",
    "Da 5 recomendaciones breves y accionables en español para mejorar calidad y eficiencia.",
  ]
    .filter(Boolean)
    .join("\n");
}
