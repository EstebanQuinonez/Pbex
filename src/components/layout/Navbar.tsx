"use client";

import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { useAppRole } from "@/components/auth/role-context";

const linkClass =
  "text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

export function Navbar() {
  const { canAccessPath, homePath } = useAppRole();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={homePath} className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Pbex Producción
        </Link>
        <nav className="flex flex-wrap items-center gap-4">
          {canAccessPath("/dashboard") ? (
            <Link className={linkClass} href="/dashboard">
              Panel
            </Link>
          ) : null}
          {canAccessPath("/registro") ? (
            <Link className={linkClass} href="/registro">
              Registros
            </Link>
          ) : null}
          {canAccessPath("/productos") ? (
            <Link className={linkClass} href="/productos">
              Productos
            </Link>
          ) : null}
          {canAccessPath("/pedidos") ? (
            <Link className={linkClass} href="/pedidos">
              Pedidos
            </Link>
          ) : null}
          {canAccessPath("/admin") ? (
            <Link className={linkClass} href="/admin/usuarios">
              Administración
            </Link>
          ) : null}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Cerrar sesión
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
