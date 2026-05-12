"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { APP_ROLES, USER_METADATA_ROLE_KEY, parseAppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type AdminUserRow = {
  id: string;
  email: string | null;
  app_role: string | null;
  created_at: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || parseAppRole(user) !== "ADMIN") {
    throw new Error("Solo administradores pueden usar esta acción.");
  }
}

function serviceOrThrow() {
  const admin = createServiceRoleClient();
  if (!admin) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor. Añádela en .env.local para gestionar usuarios desde la app.",
    );
  }
  return admin;
}

export async function getAdminUsersList(): Promise<
  { ok: true; users: AdminUserRow[] } | { ok: false; error: string }
> {
  try {
    await requireAdmin();
    const admin = serviceOrThrow();
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
    if (error) {
      return { ok: false, error: error.message };
    }
    const users: AdminUserRow[] = data.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      app_role:
        typeof u.user_metadata?.[USER_METADATA_ROLE_KEY] === "string"
          ? (u.user_metadata[USER_METADATA_ROLE_KEY] as string)
          : null,
      created_at: u.created_at,
    }));
    return { ok: true, users };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al listar usuarios";
    return { ok: false, error: message };
  }
}

export type AdminUserActionState = { error?: string; success?: string };

const roleSchema = z.enum(APP_ROLES);

const createSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  app_role: roleSchema,
});

export async function createUserAsAdmin(
  _prev: AdminUserActionState | undefined,
  formData: FormData,
): Promise<AdminUserActionState> {
  try {
    await requireAdmin();
    const admin = serviceOrThrow();
    const parsed = createSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      app_role: formData.get("app_role"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const { email, password, app_role } = parsed.data;
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { [USER_METADATA_ROLE_KEY]: app_role },
    });
    if (error) {
      return { error: error.message };
    }
    revalidatePath("/admin/usuarios");
    return { success: `Usuario ${email} creado con rol ${app_role}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear usuario" };
  }
}

const updateRoleSchema = z.object({
  user_id: z.string().uuid("Usuario inválido"),
  app_role: roleSchema,
});

export async function updateUserRoleAsAdmin(
  _prev: AdminUserActionState | undefined,
  formData: FormData,
): Promise<AdminUserActionState> {
  try {
    await requireAdmin();
    const admin = serviceOrThrow();
    const parsed = updateRoleSchema.safeParse({
      user_id: formData.get("user_id"),
      app_role: formData.get("app_role"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const { user_id, app_role } = parsed.data;
    const { data: existing, error: getErr } = await admin.auth.admin.getUserById(user_id);
    if (getErr || !existing.user) {
      return { error: getErr?.message ?? "Usuario no encontrado" };
    }
    const meta = { ...(existing.user.user_metadata ?? {}), [USER_METADATA_ROLE_KEY]: app_role };
    const { error } = await admin.auth.admin.updateUserById(user_id, { user_metadata: meta });
    if (error) {
      return { error: error.message };
    }
    revalidatePath("/admin/usuarios");
    return { success: "Rol actualizado." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar rol" };
  }
}
