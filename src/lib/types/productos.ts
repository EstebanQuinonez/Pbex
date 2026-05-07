export type LineaProduccion = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

export type Material = {
  id: number;
  nombre: string;
  abreviatura: string;
};

export type ProductoCard = {
  id: number;
  codigo: string;
  descripcion: string;
  estado: "activo" | "inactivo";
  linea: { id: number; nombre: string } | null;
  material: { id: number; nombre: string; abreviatura: string } | null;
  espec_inyeccion: Record<string, string | number | null> | null;
  espec_soplado: Record<string, string | number | null> | null;
};

/** Valores iniciales para el formulario de edición. */
export type ProductoEditDefaults = {
  id: number;
  codigo: string;
  descripcion: string;
  linea_id: number;
  material_id: number;
  estado: "activo" | "inactivo";
  espec_inyeccion: Record<string, string | null> | null;
  espec_soplado: Record<string, string | null> | null;
};
