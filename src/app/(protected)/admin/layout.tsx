import { requireRoles } from "@/lib/auth/server-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["ADMIN"]);
  return children;
}
