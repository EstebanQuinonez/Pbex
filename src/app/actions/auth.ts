"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseAppRole, resolvePostLoginRedirect } from "@/lib/auth/roles";

export type AuthFormState = { error?: string; success?: string };

export async function signIn(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "").trim() || null;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  const role = parseAppRole(data.user);
  redirect(resolvePostLoginRedirect(nextRaw, role));
}

export async function signUp(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return {
    success:
      "Cuenta creada. Si tu organización exige confirmar el correo, revisa tu bandeja antes de iniciar sesión.",
  };
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Si falla signOut por sesión/cookies, igual redirigimos al login.
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
