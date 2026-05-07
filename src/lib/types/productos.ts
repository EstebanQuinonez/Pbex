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
  color: string | null;
  estado: "activo" | "inactivo";
  creado_en: string;
  linea: { id: number; nombre: string } | null;
  material: { id: number; nombre: string; abreviatura: string } | null;
  espec_inyeccion: Record<string, number | null> | null;
  espec_soplado: Record<string, number | null> | null;
};
