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
