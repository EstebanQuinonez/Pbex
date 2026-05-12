import { requireRoles } from "@/lib/auth/server-auth";

export default async function PedidosLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["ADMIN", "VENTAS"]);
  return children;
}
