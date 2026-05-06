"use client";

import { useEffect, useState } from "react";

type Props = { summary: string };

export function GroqRecommendations({ summary }: Props) {
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
          body: JSON.stringify({ summary }),
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
  }, [summary]);

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/80 p-6 dark:border-violet-900 dark:bg-violet-950/40">
      <h2 className="text-lg font-semibold text-violet-950 dark:text-violet-100">Recomendaciones (Groq)</h2>
      <p className="mt-1 text-sm text-violet-800/90 dark:text-violet-300/90">
        Resumen enviado al modelo; respuesta mostrada solo en tu sesión.
      </p>
      <div className="mt-4 text-sm leading-relaxed text-violet-950 dark:text-violet-100">
        {loading ? <p>Cargando recomendaciones…</p> : null}
        {error ? <p className="text-red-600 dark:text-red-400">{error}</p> : null}
        {!loading && !error && text ? (
          <div className="whitespace-pre-wrap rounded-md bg-white/70 p-4 dark:bg-zinc-900/60">{text}</div>
        ) : null}
      </div>
    </section>
  );
}
