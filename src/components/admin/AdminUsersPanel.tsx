"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdminUserRow } from "@/app/actions/admin-users";
import { APP_ROLES } from "@/lib/auth/roles";
import { createUserAsAdmin, updateUserRoleAsAdmin, type AdminUserActionState } from "@/app/actions/admin-users";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

const initial: AdminUserActionState = {};

function RoleSelect({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      required
      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
    >
      <option value="" disabled>
        Rol…
      </option>
      {APP_ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}

export function AdminUsersPanel({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [createState, createAction, createPending] = useActionState(createUserAsAdmin, initial);
  const [updateState, updateAction, updatePending] = useActionState(updateUserRoleAsAdmin, initial);

  useEffect(() => {
    if (createState?.success || updateState?.success) {
      router.refresh();
    }
  }, [createState?.success, updateState?.success, router]);

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Crear usuario</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          El usuario podrá iniciar sesión de inmediato (correo marcado como confirmado).
        </p>
        <form action={createAction} className="mt-4 grid max-w-md gap-4">
          <Field label="Correo" htmlFor="new-email">
            <Input id="new-email" name="email" type="email" required autoComplete="off" />
          </Field>
          <Field label="Contraseña inicial" htmlFor="new-password">
            <Input id="new-password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="Rol" htmlFor="new-role">
            <RoleSelect name="app_role" />
          </Field>
          {createState?.error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {createState.error}
            </p>
          ) : null}
          {createState?.success ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
              {createState.success}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={createPending}
            className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {createPending ? "Creando…" : "Crear usuario"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Usuarios</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Cambia el rol en <code className="text-xs">user_metadata.app_role</code> (se guarda al enviar cada fila).
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Correo</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Rol actual</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300">Nuevo rol</th>
                <th className="px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                  <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{u.email ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.app_role ?? "—"}</td>
                  <td className="px-3 py-2">
                    <form action={updateAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="user_id" value={u.id} />
                      <RoleSelect name="app_role" defaultValue={u.app_role} />
                      <button
                        type="submit"
                        disabled={updatePending}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-900"
                      >
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{new Date(u.created_at).toLocaleString("es")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {updateState?.error ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {updateState.error}
          </p>
        ) : null}
        {updateState?.success ? (
          <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400" role="status">
            {updateState.success}
          </p>
        ) : null}
      </section>
    </div>
  );
}
