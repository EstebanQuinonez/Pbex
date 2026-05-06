export const EVENT_TYPES = {
  PRODUCTION_RECORDED: "PRODUCTION_RECORDED",
  DEFECT_RECORDED: "DEFECT_RECORDED",
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
  tipo: EventType;
  payload: ProductionPayload | DefectPayload;
  created_at: string;
};
