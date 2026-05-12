export type ProductoRegistroOption = {
  id: number;
  codigo: string;
  descripcion: string;
  linea_id: number;
};

export type MaquinaRegistroOption = {
  id: number;
  codigo: string;
  nombre: string;
  linea_id: number;
};

export type EncargadoRegistroOption = {
  id: number;
  nombre: string;
  linea_id: number;
  turno: string;
};

export type OperarioRegistroOption = {
  id: number;
  nombre: string;
  turno: string;
};

export type RegistroCatalogs = {
  productos: ProductoRegistroOption[];
  maquinas: MaquinaRegistroOption[];
  encargados: EncargadoRegistroOption[];
  operarios: OperarioRegistroOption[];
};

/** Producciones recientes elegibles para asociar MERMA_RECORDED. */
export type ProduccionParaMerma = {
  id: string;
  timestamp: string;
  cantidad_bruta: number;
  merma_acumulada: number;
  /** Bruta − merma ya registrada (misma referencia). */
  disponible: number;
  producto_id: number | null;
  maquina_id: number | null;
  turno: string | null;
};
