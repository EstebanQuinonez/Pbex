export const EVENT_TYPES = {
  PRODUCTION_RECORDED: "PRODUCTION_RECORDED",
  MERMA_RECORDED: "MERMA_RECORDED",
  DEFECT_RECORDED: "DEFECT_RECORDED",
  MACHINE_FAILURE_RECORDED: "MACHINE_FAILURE_RECORDED",
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_COMPLETED: "ORDER_COMPLETED",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export type ProductionPayload = {
  linea_produccion: string;
  turno: string;
  produccion_total: number;
  porcentaje_desperdicio: number;
};

export type DefectPayload = {
  nombre_maquina: string;
  tipo_defecto: string;
  cantidad: number;
};

export type EventoRow = {
  id: string;
  user_id: string;
  type: EventType;
  payload: ProductionPayload | DefectPayload | Record<string, unknown>;
  timestamp: string;
  producto_id?: number | null;
  maquina_id?: number | null;
  operario_id?: number | null;
  encargado_id?: number | null;
  cliente_id?: number | null;
  pedido_id?: number | null;
  vendedor_id?: number | null;
  turno?: string | null;
  cantidad?: number | null;
  merma?: number | null;
  defecto?: string | null;
  falla_maquina?: string | null;
  /** MERMA_RECORDED → evento PRODUCTION_RECORDED padre. */
  produccion_evento_id?: string | null;
};
