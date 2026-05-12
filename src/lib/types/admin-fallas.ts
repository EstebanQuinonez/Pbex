export type FallaMaquinaReporteRow = {
  id: string;
  timestamp: string;
  cantidad: number | null;
  falla_maquina: string | null;
  falla_ocurrida_at: string | null;
  falla_resuelta: boolean;
  maquina_id: number | null;
  maquinas: { codigo: string; nombre: string } | null;
};
