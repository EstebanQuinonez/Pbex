"use client";

import { useActionState } from "react";
import { setFallaMaquinaResuelta, type FallaResueltaActionState } from "@/app/actions/admin-fallas";
import type { FallaMaquinaReporteRow } from "@/lib/types/admin-fallas";

const initial: FallaResueltaActionState = {};

function fmtTs(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function labelFalla(nombre: string | null): string {
  if (!nombre) return "—";
  return nombre.replaceAll("_", " ");
}

export function AdminFallasPanel({ rows }: { rows: FallaMaquinaReporteRow[] }) {
  const [state, formAction, pending] = useActionState(setFallaMaquinaResuelta, initial);

  return (
    <div className="flex flex-col gap-4">
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          {state.success}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No hay reportes de falla de máquina con catálogo enlazado. Los nuevos registros desde planta aparecerán aquí.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Falla ocurrió</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Alta sistema</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Máquina</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Tipo</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Cantidad</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Estado</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const maq = r.maquinas;
                const maqLabel = maq ? `${maq.codigo} — ${maq.nombre}` : r.maquina_id != null ? `#${r.maquina_id}` : "—";
                return (
                  <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800/80">
                    <td className="px-3 py-2 tabular-nums text-zinc-800 dark:text-zinc-200">
                      {fmtTs(r.falla_ocurrida_at)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">{fmtTs(r.timestamp)}</td>
                    <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{maqLabel}</td>
                    <td className="px-3 py-2 capitalize text-zinc-800 dark:text-zinc-200">
                      {labelFalla(r.falla_maquina)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{r.cantidad ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          r.falla_resuelta
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                            : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950 dark:bg-amber-900/40 dark:text-amber-100"
                        }
                      >
                        {r.falla_resuelta ? "Resuelto" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <form action={formAction} className="flex flex-wrap gap-1">
                        <input type="hidden" name="evento_id" value={r.id} />
                        {r.falla_resuelta ? (
                          <button
                            type="submit"
                            name="resuelta"
                            value="false"
                            disabled={pending}
                            className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                          >
                            Marcar pendiente
                          </button>
                        ) : (
                          <button
                            type="submit"
                            name="resuelta"
                            value="true"
                            disabled={pending}
                            className="rounded border border-emerald-600 bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Marcar resuelto
                          </button>
                        )}
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
