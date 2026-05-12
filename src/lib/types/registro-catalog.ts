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
