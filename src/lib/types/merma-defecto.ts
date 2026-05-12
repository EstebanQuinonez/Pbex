/** Valores permitidos en `eventos.defecto` (CHECK en migración 003). */
export const MERMA_DEFECTO_TIPOS = [
  { value: "manchas", label: "Manchas" },
  { value: "incompletos", label: "Incompletos" },
  { value: "color", label: "Color" },
  { value: "rebaba", label: "Rebaba" },
  { value: "rechazo_calidad", label: "Rechazo calidad" },
] as const;

export type MermaDefectoTipo = (typeof MERMA_DEFECTO_TIPOS)[number]["value"];
