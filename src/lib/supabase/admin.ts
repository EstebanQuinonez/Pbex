import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con `service_role` solo para el servidor (Server Actions / Route Handlers).
 * Nunca importes esto en componentes cliente.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
