import { listFallasMaquinaReportes } from "@/app/actions/admin-fallas";
import { AdminFallasPanel } from "@/components/admin/AdminFallasPanel";

export default async function AdminFallasPage() {
  const result = await listFallasMaquinaReportes();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reportes de fallas de máquina
        </h1>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {result.error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reportes de fallas de máquina
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Listado de reportes registrados desde planta. Marca cuando el mantenimiento haya cerrado la incidencia.
        </p>
      </div>
      <AdminFallasPanel rows={result.rows} />
    </div>
  );
}
