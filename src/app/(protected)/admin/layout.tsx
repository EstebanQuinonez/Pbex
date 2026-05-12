import Link from "next/link";
import { requireRoles } from "@/lib/auth/server-auth";

const navLink =
  "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["ADMIN"]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-8 flex flex-wrap gap-1 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <Link href="/admin/usuarios" className={navLink}>
          Usuarios y roles
        </Link>
        <Link href="/admin/fallas" className={navLink}>
          Reportes de fallas de máquina
        </Link>
      </nav>
      {children}
    </div>
  );
}
