import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile";

export async function fetchGroqRecommendations(summary: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return "Configura GROQ_API_KEY en el entorno para ver recomendaciones de IA.";
  }

  const client = new Groq({ apiKey });

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Eres un consultor de manufactura y calidad. Responde en español, tono profesional y conciso.",
      },
      { role: "user", content: summary },
    ],
    temperature: 0.4,
    max_tokens: 800,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  return text || "No se recibió texto del modelo.";
}
