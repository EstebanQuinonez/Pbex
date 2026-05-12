import { z } from "zod";

/** Numeric desde Postgres json puede llegar como string. */
const numish = z.union([z.number(), z.string()]).transform((v) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
});

export const kpiMaquinaProduccionSchema = z.object({
  maquina_id: z.number().nullable().optional(),
  total_produccion: numish,
  maquina_codigo: z.string().nullable().optional(),
  maquina_nombre: z.string().nullable().optional(),
  linea_id: z.number().nullable().optional(),
  linea_nombre: z.string().nullable().optional(),
});

export const kpiProduccionDiaSchema = z.object({
  dia: z.string(),
  produccion: numish,
});

export const kpiMermaMaquinaSchema = z.object({
  maquina_id: z.number().nullable().optional(),
  merma_total: numish,
  maquina_codigo: z.string().nullable().optional(),
  maquina_nombre: z.string().nullable().optional(),
});

export const kpiDefectoTopSchema = z.object({
  defecto: z.string(),
  defecto_catalogo_id: z.number().nullable().optional(),
  en_catalogo: z.boolean().optional(),
  eventos: numish,
  unidades: numish,
});

export const kpiFallaSchema = z.object({
  falla_maquina: z.string(),
  falla_catalogo_id: z.number().nullable().optional(),
  en_catalogo: z.boolean().optional(),
  ocurrencias: numish,
});

export const kpiPedidoEstadoSchema = z.object({
  estado: z.string(),
  cantidad: numish,
});

export const kpiDashboardSchema = z.object({
  produccion_total: numish,
  merma_total: numish,
  pct_merma: numish.nullable().optional(),
  por_maquina: z.array(kpiMaquinaProduccionSchema).optional().default([]),
  por_turno: z
    .array(z.object({ turno: z.string(), total_produccion: numish }))
    .optional()
    .default([]),
  produccion_por_producto: z
    .array(
      z.object({
        producto_id: z.number().nullable().optional(),
        producto_codigo: z.string().nullable().optional(),
        producto_descripcion: z.string().nullable().optional(),
        total_produccion: numish,
      }),
    )
    .optional()
    .default([]),
  produccion_por_dia: z.array(kpiProduccionDiaSchema).optional().default([]),
  merma_por_maquina: z.array(kpiMermaMaquinaSchema).optional().default([]),
  defectos_top: z.array(kpiDefectoTopSchema).optional().default([]),
  fallas_maquina_top: z.array(kpiFallaSchema).optional().default([]),
  pedidos_completados: numish,
  pedidos_creados: numish,
  cumplimiento_pedidos_pct: numish.nullable().optional(),
  pedidos_tabla_por_estado: z.array(kpiPedidoEstadoSchema).optional().default([]),
  pedidos_tabla_top_clientes: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  filtros: z.record(z.string(), z.unknown()).optional(),
});

export type KpiDashboard = z.infer<typeof kpiDashboardSchema>;
