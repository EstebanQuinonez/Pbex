import { requireRoles } from "@/lib/auth/server-auth";

export default async function RegistroLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["ENCARGADO_LINEA"]);
  return children;
}
