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
    return "Las sugerencias automáticas no están disponibles en este entorno. Si las necesitas, contacta al administrador.";
  }

  const client = new Groq({ apiKey });

  const userBlocks: string[] = [];
  if (input.structuredContext && Object.keys(input.structuredContext).length > 0) {
    userBlocks.push(
      "### Contexto numérico (JSON)\n```json\n" +
        JSON.stringify(input.structuredContext, null, 2) +
        "\n```",
    );
  }
  userBlocks.push("### Síntesis del periodo\n" + input.summary);
  userBlocks.push(
    [
      "### Formato de salida (obligatorio)",
      "Responde únicamente con entre 4 y 6 líneas; cada línea debe empezar por un número, punto y espacio (ej.: \"1. ...\").",
      "No escribas títulos, introducciones, conclusiones ni párrafos fuera de esa lista.",
      "No uses frases como \"basado en los datos\", \"datos proporcionados\", \"siguientes recomendaciones\" o \"a continuación\" al comienzo del mensaje o fuera de los ítems numerados.",
      "Prioriza: mantenimiento preventivo si hay fallas de máquina o concentración de merma; ajuste de carga o turnos si la producción por máquina o turno está desbalanceada; eficiencia y calidad si la merma o los defectos son altos o empeoran frente a la tendencia.",
      "Cada ítem debe ser accionable (qué revisar, qué medir, plazo corto). Español claro y directo.",
    ].join("\n"),
  );

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Eres un consultor senior de manufactura, TPM y calidad en planta de transformación (inyección/soplado). " +
          "Tu respuesta para el usuario final es solo una lista numerada de acciones concretas, sin metatexto ni introducción.",
      },
      { role: "user", content: userBlocks.join("\n\n") },
    ],
    temperature: 0.35,
    max_tokens: 900,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  return text || "No hubo respuesta del asistente. Vuelve a intentar.";
}
