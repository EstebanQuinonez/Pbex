import { getAdminUsersList } from "@/app/actions/admin-users";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";

export default async function AdminPage() {
  const result = await getAdminUsersList();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Administración</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">No se puede cargar el panel de usuarios</p>
          <p className="mt-2 text-amber-800 dark:text-amber-200/90">{result.error}</p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-amber-800 dark:text-amber-200/90">
            <li>
              Añade <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">SUPABASE_SERVICE_ROLE_KEY</code> en{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">.env.local</code> (clave de servicio del
              proyecto, solo servidor).
            </li>
            <li>
              Crea tu primer admin con <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">npm run seed:admin</code>{" "}
              (ver README) o asigna <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">app_role: ADMIN</code> en
              Supabase → Authentication → Users.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Administración</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Gestión de usuarios y roles (<code className="text-xs">user_metadata.app_role</code>). Solo visible para rol{" "}
          <strong>ADMIN</strong>.
        </p>
      </div>
      <AdminUsersPanel users={result.users} />
    </div>
  );
}
