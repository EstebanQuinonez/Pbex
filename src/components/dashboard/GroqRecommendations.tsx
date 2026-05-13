"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  summary: string;
  structuredContext?: Record<string, unknown>;
};

/** Ignora párrafos introductorios habituales del modelo. */
function isNoiseIntroLine(line: string): boolean {
  const t = line.toLowerCase();
  return (
    /basado en (los )?datos|datos proporcionados|siguientes recomendaciones|se presentan las siguientes|presenta las siguientes|a continuaci[oó]n|en base a la informaci[oó]n|de acuerdo con (los )?indicadores/i.test(
      t,
    ) || /^(para|en) (los )?supervisores/i.test(t)
  );
}

/** Recorta todo lo anterior a la primera línea numerada (1. …). */
function trimToFirstNumberedBlock(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const idx = lines.findIndex((l) => /^\s*\d+[\.)]\s/.test(l));
  if (idx === -1) return raw.trim();
  return lines.slice(idx).join("\n").trim();
}

/** Convierte respuesta tipo "1. ..." / guiones en bloques legibles. */
function parseRecommendationBlocks(raw: string): { intro: string[]; items: string[] } {
  const intro: string[] = [];
  const items: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const numbered = t.match(/^\d+[\.)]\s*(.+)$/);
    const bullet = t.match(/^[-•*]\s*(.+)$/);
    if (numbered?.[1]) items.push(numbered[1].trim());
    else if (bullet?.[1]) items.push(bullet[1].trim());
    else if (!isNoiseIntroLine(t)) intro.push(t);
  }
  return { intro, items };
}

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
          throw new Error(data.error || "No se pudieron cargar las sugerencias.");
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

  const parsed = useMemo(() => {
    if (!text) return { intro: [], items: [] };
    const trimmed = trimToFirstNumberedBlock(text);
    return parseRecommendationBlocks(trimmed);
  }, [text]);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[var(--pbex-border)] bg-gradient-to-br from-[var(--pbex-surface)] to-white shadow-md dark:border-zinc-700/80 dark:from-zinc-900 dark:to-zinc-950"
    >
      <div
        className="flex items-start gap-3 border-b border-white/10 bg-gradient-to-r from-[#0a2540] via-[#124771] to-[#0c5d8f] px-5 py-4 dark:from-[#071018] dark:via-[#0c2030] dark:to-[#071018]"
      >
        <span
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg text-white shadow-inner backdrop-blur-sm"
          aria-hidden
        >
          ✦
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-snug text-white">Recomendaciones para la operación</h2>
        </div>
      </div>

      <div className="border-t border-white/50 bg-white/60 px-5 py-4 dark:border-zinc-700/50 dark:bg-zinc-950/40">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Preparando recomendaciones">
            <div
              className="h-3 w-full max-w-md animate-pulse rounded-full opacity-60"
              style={{ background: "var(--pbex-border)" }}
            />
            <div
              className="h-3 w-full max-w-lg animate-pulse rounded-full opacity-50"
              style={{ background: "var(--pbex-border)" }}
            />
            <div
              className="h-3 w-4/5 max-w-sm animate-pulse rounded-full opacity-40"
              style={{ background: "var(--pbex-border)" }}
            />
            <p className="text-xs font-medium text-[#124771] dark:text-sky-300/90">Preparando sugerencias…</p>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && text ? (
          <div className="space-y-4 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
            {parsed.intro.length > 0 ? (
              <div className="space-y-2 text-zinc-600 dark:text-zinc-300">
                {parsed.intro.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : null}
            {parsed.items.length > 0 ? (
              <ol
                className="list-none space-y-3.5 border-l-2 border-l-[#0c8fc4] pl-4 dark:border-l-sky-500/50"
              >
                {parsed.items.map((item, i) => (
                  <li key={i} className="relative pl-1">
                    <span
                      className="absolute -left-[1.15rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#124771] to-[#0c5d8f] text-[11px] font-bold text-white shadow-sm dark:from-slate-700 dark:to-slate-600"
                    >
                      {i + 1}
                    </span>
                    <span className="block pt-0.5">{item}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="whitespace-pre-wrap rounded-xl border border-zinc-100 bg-white/90 p-4 text-zinc-900 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100">
                {text}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
