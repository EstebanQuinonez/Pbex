"use client";

import { useEffect, useState } from "react";

type Props = {
  summary: string;
  structuredContext?: Record<string, unknown>;
};

export function GroqRecommendations({ summary, structuredContext }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary,
            structuredContext: structuredContext ?? undefined,
          }),
        });
        const data = (await res.json()) as { recommendations?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Error al obtener recomendaciones");
        }
        if (!cancelled) setText(data.recommendations ?? "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [summary, structuredContext]);

  return (
    <section className="rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50/95 to-white p-6 shadow-sm dark:border-violet-900/60 dark:from-violet-950/50 dark:to-zinc-950/80">
      <h2 className="text-lg font-semibold text-violet-950 dark:text-violet-100">
        Recomendaciones para supervisión
      </h2>
      <p className="mt-1 text-sm text-violet-900/80 dark:text-violet-200/85">
        Generadas con IA a partir de los KPI del tablero (producción, merma, defectos, fallas y tendencias). Solo
        visible en tu sesión.
      </p>
      <div className="mt-4 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
        {loading ? <p className="text-zinc-600 dark:text-zinc-400">Generando recomendaciones…</p> : null}
        {error ? <p className="text-red-600 dark:text-red-400">{error}</p> : null}
        {!loading && !error && text ? (
          <div className="whitespace-pre-wrap rounded-lg border border-violet-100 bg-white/90 p-4 text-zinc-900 shadow-inner dark:border-violet-900/40 dark:bg-zinc-900/70 dark:text-zinc-100">
            {text}
          </div>
        ) : null}
      </div>
    </section>
  );
}
