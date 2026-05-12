import { requireRoles } from "@/lib/auth/server-auth";

export default async function EditProductoLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["ADMIN"]);
  return children;
}
