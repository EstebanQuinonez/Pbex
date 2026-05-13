import { NextResponse } from "next/server";
import { z } from "zod";
import { parseAppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fetchGroqRecommendations } from "@/services/groqService";

const bodySchema = z.object({
  summary: z.string().min(10, "Resumen demasiado corto"),
  structuredContext: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = parseAppRole(user);
  if (role !== "GERENTE" && role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const recommendations = await fetchGroqRecommendations({
      summary: parsed.data.summary,
      structuredContext: parsed.data.structuredContext,
    });
    return NextResponse.json({ recommendations });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudieron generar las sugerencias.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
