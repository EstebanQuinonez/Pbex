import { requireRoles } from "@/lib/auth/server-auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["ADMIN", "GERENTE"]);
  return children;
}
