/**
 * Crea (o actualiza metadata a ADMIN) el primer usuario administrador.
 * Requiere Node 20+ con: node --env-file=.env.local scripts/seed-admin.mjs
 *
 * Variables en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   BOOTSTRAP_ADMIN_EMAIL
 *   BOOTSTRAP_ADMIN_PASSWORD   (mín. 8 caracteres)
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

const ROLE_KEY = "app_role";

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!url || !serviceKey) {
  fail("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
}
if (!email || !password) {
  fail("Faltan BOOTSTRAP_ADMIN_EMAIL o BOOTSTRAP_ADMIN_PASSWORD en .env.local");
}
if (password.length < 8) {
  fail("BOOTSTRAP_ADMIN_PASSWORD debe tener al menos 8 caracteres.");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200, page: 1 });
if (listErr) {
  fail(`Error listando usuarios: ${listErr.message}`);
}

const existing = list.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());

if (existing) {
  const meta = { ...(existing.user_metadata ?? {}), [ROLE_KEY]: "ADMIN" };
  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    user_metadata: meta,
    password,
  });
  if (error) {
    fail(`Error actualizando admin: ${error.message}`);
  }
  console.log(`Usuario existente actualizado a ADMIN y contraseña renovada: ${email}`);
} else {
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { [ROLE_KEY]: "ADMIN" },
  });
  if (error) {
    fail(`Error creando admin: ${error.message}`);
  }
  console.log(`Usuario administrador creado: ${email}`);
}

console.log("Listo. Inicia sesión en la app con ese correo y contraseña.");
