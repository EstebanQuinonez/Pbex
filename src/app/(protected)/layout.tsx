import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { parseAppRole } from "@/lib/auth/roles";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const role = parseAppRole(user);

    return <ProtectedShell role={role}>{children}</ProtectedShell>;
  } catch {
    redirect("/login");
  }
}
