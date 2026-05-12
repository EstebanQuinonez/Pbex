import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile";

export type GroqRecommendationInput = {
  summary: string;
  /** Métricas y tendencias del dashboard (JSON serializable). */
  structuredContext?: Record<string, unknown>;
};

export async function fetchGroqRecommendations(input: GroqRecommendationInput): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return "Configura GROQ_API_KEY en el entorno para ver recomendaciones de IA.";
  }

  const client = new Groq({ apiKey });

  const userBlocks: string[] = [];
  if (input.structuredContext && Object.keys(input.structuredContext).length > 0) {
    userBlocks.push(
      "### Datos estructurados del tablero (JSON)\n```json\n" +
        JSON.stringify(input.structuredContext, null, 2) +
        "\n```",
    );
  }
  userBlocks.push("### Resumen operativo\n" + input.summary);
  userBlocks.push(
    [
      "### Instrucciones",
      "Genera entre 4 y 6 recomendaciones numeradas para supervisores de planta.",
      "Prioriza: mantenimiento preventivo si hay fallas de máquina o concentración de merma; ajuste de carga o turnos si la producción por máquina/turno está desbalanceada; alertas de eficiencia y calidad si % merma o defectos son altos o empeoran vs la tendencia.",
      "Cada ítem debe ser accionable (qué revisar, qué medir, plazo sugerido corto). Español claro, sin jerga innecesaria.",
    ].join("\n"),
  );

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Eres un consultor senior de manufactura, TPM y calidad en planta de transformación (inyección/soplado). " +
          "Interpretas KPIs reales y respondes en español con tono profesional, directo y fácil de ejecutar en piso.",
      },
      { role: "user", content: userBlocks.join("\n\n") },
    ],
    temperature: 0.35,
    max_tokens: 900,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  return text || "No se recibió texto del modelo.";
}
