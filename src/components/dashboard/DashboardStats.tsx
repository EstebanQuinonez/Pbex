import type { AnalyticsResult } from "@/services/analyticsService";

const HIGH_WASTE = 5;

export function DashboardStats({ analytics }: { analytics: AnalyticsResult }) {
  const { production: p, defects: d } = analytics;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Métricas de producción</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <span className="font-medium">Registros:</span> {p.registros}
          </li>
          <li>
            <span className="font-medium">Producción total:</span> {p.produccionTotal} u.
          </li>
          <li>
            <span className="font-medium">Desperdicio medio:</span> {p.promedioDesperdicioPct.toFixed(2)}%
          </li>
          <li>
            <span className="font-medium">Eficiencia estimada:</span> {p.eficienciaPct.toFixed(2)}%
            <span className="ml-1 text-zinc-500">(100% − desperdicio medio)</span>
          </li>
          <li>
            <span className="font-medium">Registros con desperdicio &gt;{HIGH_WASTE}%:</span>{" "}
            <span className={p.alertasDesperdicioAlto > 0 ? "text-amber-600 dark:text-amber-400" : ""}>
              {p.alertasDesperdicioAlto}
            </span>
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Estadísticas de defectos</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <span className="font-medium">Total unidades con defecto:</span> {d.totalDefectos}
          </li>
          <li>
            <span className="font-medium">Aumento anormal (7d vs 7d previos, ratio ≥1.6):</span>{" "}
            <span className={d.aumentoAnormal ? "text-red-600 dark:text-red-400" : "text-emerald-600"}>
              {d.aumentoAnormal ? "Sí — revisar causas" : "No detectado"}
            </span>
          </li>
          {d.ratioRecienteVsAnterior != null ? (
            <li>
              <span className="font-medium">Ratio reciente / anterior:</span>{" "}
              {d.ratioRecienteVsAnterior.toFixed(2)}
            </li>
          ) : null}
        </ul>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Por máquina</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(d.porMaquina)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([k, v]) => (
                  <li key={k}>
                    {k}: <span className="font-medium">{v}</span>
                  </li>
                ))}
              {Object.keys(d.porMaquina).length === 0 ? (
                <li className="text-zinc-500">Sin datos</li>
              ) : null}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Por tipo</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(d.porTipo)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([k, v]) => (
                  <li key={k}>
                    {k}: <span className="font-medium">{v}</span>
                  </li>
                ))}
              {Object.keys(d.porTipo).length === 0 ? (
                <li className="text-zinc-500">Sin datos</li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
