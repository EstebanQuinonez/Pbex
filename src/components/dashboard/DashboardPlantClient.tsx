"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { KpiDashboard } from "@/lib/types/dashboard-kpi";
import type { DashboardFilters } from "@/services/dashboardKpiService";
import { formatDefectoLabel } from "@/services/dashboardKpiService";
import { GroqRecommendations } from "@/components/dashboard/GroqRecommendations";

export type MaquinaOption = { id: number; codigo: string; nombre: string };

type Props = {
  kpi: KpiDashboard | null;
  kpiError: string | null;
  maquinas: MaquinaOption[];
  filters: DashboardFilters;
  narrativeSummary: string;
  structuredContext: Record<string, unknown>;
};

const chartMuted = "#64748b";
const prodColor = "#059669";
const mermaColor = "#d97706";
const defectColor = "#4f46e5";

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toFixed(1)}%`;
}

function fmtInt(n: number): string {
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 }).format(n);
}

export function DashboardPlantClient({
  kpi,
  kpiError,
  maquinas,
  filters,
  narrativeSummary,
  structuredContext,
}: Props) {
  const router = useRouter();

  const produccionDiaria =
    kpi?.produccion_por_dia.map((d) => ({
      dia: d.dia,
      etiqueta: d.dia.slice(5),
      produccion: d.produccion,
    })) ?? [];

  const mermaMaquina =
    kpi?.merma_por_maquina.map((m) => ({
      clave: String(m.maquina_id ?? m.maquina_codigo ?? "?"),
      nombre:
        [m.maquina_codigo, m.maquina_nombre].filter(Boolean).join(" · ") ||
        `Máquina ${m.maquina_id ?? "—"}`,
      merma: Number(m.merma_total),
    })) ?? [];

  const defectosChart =
    kpi?.defectos_top.slice(0, 10).map((d) => ({
      nombre: formatDefectoLabel(d.defecto),
      unidades: Number(d.unidades),
    })) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Filtros</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Los datos se agregan en Supabase con una sola consulta RPC. Fechas en calendario UTC.
            </p>
          </div>
          <form
            className="flex flex-wrap items-end gap-3"
            action="/dashboard"
            method="get"
            onSubmit={() => {
              /* navegación por GET nativo */
            }}
          >
            <label className="flex flex-col text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Desde
              <input
                type="date"
                name="desde"
                defaultValue={filters.desde}
                className="mt-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Hasta
              <input
                type="date"
                name="hasta"
                defaultValue={filters.hasta}
                className="mt-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Máquina
              <select
                name="maquina"
                defaultValue={filters.maquinaId != null ? String(filters.maquinaId) : ""}
                className="mt-1 min-w-[200px] rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Todas</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} — {m.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Turno
              <select
                name="turno"
                defaultValue={filters.turno ?? ""}
                className="mt-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Todos</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Aplicar
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
              onClick={() => router.push("/dashboard")}
            >
              Restablecer 30 días
            </button>
          </form>
        </div>
      </section>

      {kpiError ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <strong className="font-semibold">No se pudieron cargar los KPI.</strong> {kpiError}
          <p className="mt-2 text-xs opacity-90">
            Aplica la migración <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/60">006_dashboard_rls_and_kpis.sql</code> en
            Supabase y comprueba que tu usuario tenga rol <code className="rounded px-1">GERENTE</code> o{" "}
            <code className="rounded px-1">ADMIN</code> en <code className="rounded px-1">user_metadata.app_role</code>.
          </p>
        </div>
      ) : null}

      {kpi ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-zinc-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300/90">
                Producción
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-950 dark:text-emerald-50">
                {fmtInt(kpi.produccion_total)}
              </p>
              <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-200/80">unidades registradas</p>
            </article>
            <article className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm dark:border-amber-900/50 dark:from-amber-950/35 dark:to-zinc-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-300/90">
                Merma
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-950 dark:text-amber-50">
                {fmtInt(kpi.merma_total)}
              </p>
              <p className="mt-1 text-sm text-amber-900/85 dark:text-amber-200/80">
                {kpi.pct_merma != null ? (
                  <>
                    <span className="font-medium">{pct(Number(kpi.pct_merma))}</span> sobre producción
                  </>
                ) : (
                  "Sin producción en el periodo — % no aplicable"
                )}
              </p>
            </article>
            <article className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm dark:border-sky-900/50 dark:from-sky-950/35 dark:to-zinc-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-300/90">
                Pedidos (eventos)
              </p>
              <p className="mt-2 flex flex-wrap items-baseline gap-2 text-zinc-800 dark:text-zinc-100">
                <span className="text-2xl font-semibold tabular-nums">{fmtInt(kpi.pedidos_creados)}</span>
                <span className="text-sm text-zinc-500">creados</span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="text-2xl font-semibold tabular-nums">{fmtInt(kpi.pedidos_completados)}</span>
                <span className="text-sm text-zinc-500">completados</span>
              </p>
              <p className="mt-2 text-sm text-sky-950/85 dark:text-sky-100/85">
                Cumplimiento (completados / creados):{" "}
                <span className="font-semibold">{pct(kpi.cumplimiento_pedidos_pct ?? null)}</span>
              </p>
            </article>
          </section>

          <div className="grid gap-6 lg:grid-cols-1">
            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Producción por día</h3>
              <p className="mt-0.5 text-xs text-zinc-500">Suma de unidades por día (UTC), eventos PRODUCTION_RECORDED.</p>
              <div className="mt-4 h-[300px] w-full min-w-0">
                {produccionDiaria.length === 0 ? (
                  <p className="text-sm text-zinc-500">Sin datos en el rango seleccionado.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={produccionDiaria} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-700" />
                      <XAxis dataKey="etiqueta" tick={{ fill: chartMuted, fontSize: 11 }} />
                      <YAxis tick={{ fill: chartMuted, fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #e4e4e7",
                          fontSize: 12,
                        }}
                        formatter={(v) => [fmtInt(Number(v ?? 0)), "Producción"]}
                        labelFormatter={(_, p) => {
                          const pl = p?.[0]?.payload as { dia?: string } | undefined;
                          return pl?.dia ?? "";
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="produccion" name="Unidades" stroke={prodColor} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Merma por máquina</h3>
                <p className="mt-0.5 text-xs text-zinc-500">Eventos MERMA_RECORDED agregados por máquina.</p>
                <div className="mt-4 h-[300px] w-full min-w-0">
                  {mermaMaquina.length === 0 ? (
                    <p className="text-sm text-zinc-500">Sin mermas en el filtro.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mermaMaquina}
                        layout="vertical"
                        margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-700" horizontal={false} />
                        <XAxis type="number" tick={{ fill: chartMuted, fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="nombre"
                          width={120}
                          tick={{ fill: chartMuted, fontSize: 10 }}
                          interval={0}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          formatter={(v) => [fmtInt(Number(v ?? 0)), "Merma"]}
                        />
                        <Bar dataKey="merma" name="Merma (u.)" radius={[0, 4, 4, 0]}>
                          {mermaMaquina.map((_, i) => (
                            <Cell key={i} fill={mermaColor} fillOpacity={0.85} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Defectos más frecuentes</h3>
                <p className="mt-0.5 text-xs text-zinc-500">Por unidades (columna + legado en payload).</p>
                <div className="mt-4 h-[300px] w-full min-w-0">
                  {defectosChart.length === 0 ? (
                    <p className="text-sm text-zinc-500">Sin defectos en el filtro.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={defectosChart} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-700" horizontal={false} />
                        <XAxis type="number" tick={{ fill: chartMuted, fontSize: 11 }} />
                        <YAxis type="category" dataKey="nombre" width={130} tick={{ fill: chartMuted, fontSize: 10 }} interval={0} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          formatter={(v) => [fmtInt(Number(v ?? 0)), "Unidades"]}
                        />
                        <Bar dataKey="unidades" name="Unidades" radius={[0, 4, 4, 0]}>
                          {defectosChart.map((_, i) => (
                            <Cell key={i} fill={defectColor} fillOpacity={0.85} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : null}

      {kpi ? (
        <GroqRecommendations summary={narrativeSummary} structuredContext={structuredContext} />
      ) : null}
    </div>
  );
}
