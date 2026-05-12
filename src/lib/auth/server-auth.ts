import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/roles";
import { homePathForRole, parseAppRole } from "@/lib/auth/roles";

export async function getServerAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = parseAppRole(user);
  return { supabase, user, role };
}

/** Sub-layouts por carpeta: exige uno de los roles permitidos. */
export async function requireRoles(allowed: readonly AppRole[]) {
  const { user, role } = await getServerAuth();
  if (!user) redirect("/login");
  if (!role || !allowed.includes(role)) redirect(homePathForRole(role));
  return { user, role };
}
