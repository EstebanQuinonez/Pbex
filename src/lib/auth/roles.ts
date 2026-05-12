import type { User } from "@supabase/supabase-js";

export const APP_ROLES = ["ADMIN", "GERENTE", "ENCARGADO_LINEA", "VENTAS"] as const;

export type AppRole = (typeof APP_ROLES)[number];

const ROLE_SET = new Set<string>(APP_ROLES);

/** Clave en `user.user_metadata` (configurable en Supabase Auth). */
export const USER_METADATA_ROLE_KEY = "app_role" as const;

export function parseAppRole(user: User | null | undefined): AppRole | null {
  const raw = user?.user_metadata?.[USER_METADATA_ROLE_KEY];
  if (typeof raw !== "string") return null;
  const normalized = raw.trim().toUpperCase();
  return ROLE_SET.has(normalized) ? (normalized as AppRole) : null;
}

export function isAdmin(role: AppRole | null): boolean {
  return role === "ADMIN";
}

export function isGerente(role: AppRole | null): boolean {
  return role === "GERENTE";
}

export function isEncargadoLinea(role: AppRole | null): boolean {
  return role === "ENCARGADO_LINEA";
}

export function isVentas(role: AppRole | null): boolean {
  return role === "VENTAS";
}

/** Rutas de negocio que exigen sesión (el layout protegido también valida). */
export function isAuthRequiredPath(pathname: string): boolean {
  if (pathname.startsWith("/api")) return false;
  const prefixes = ["/dashboard", "/registro", "/productos", "/pedidos", "/admin"];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

type RouteRule = { prefix: string; roles: readonly AppRole[] };

/** Orden: prefijos más largos primero para no solapar mal (p. ej. /admin antes que /). */
const ROUTE_ROLE_RULES: RouteRule[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/dashboard", roles: ["ADMIN", "GERENTE"] },
  { prefix: "/registro", roles: ["ENCARGADO_LINEA"] },
  { prefix: "/pedidos", roles: ["ADMIN", "VENTAS"] },
  { prefix: "/productos", roles: [] },
];

function ruleForPath(pathname: string): RouteRule | null {
  for (const rule of ROUTE_ROLE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule;
    }
  }
  return null;
}

/**
 * `roles` vacío = cualquier usuario autenticado (p. ej. /productos).
 * Si no hay regla para el path, no se exige rol aquí (solo auth en layout).
 */
export function roleAllowsPath(role: AppRole | null, pathname: string): boolean {
  const rule = ruleForPath(pathname);
  if (!rule) return true;
  if (rule.roles.length === 0) return true;
  if (!role) return false;
  return (rule.roles as readonly string[]).includes(role);
}

export function homePathForRole(role: AppRole | null): string {
  switch (role) {
    case "ADMIN":
    case "GERENTE":
      return "/dashboard";
    case "ENCARGADO_LINEA":
      return "/registro";
    case "VENTAS":
      return "/pedidos";
    default:
      return "/productos";
  }
}

/** Tras login: respeta `next` interno solo si el rol puede acceder a esa ruta. */
export function resolvePostLoginRedirect(nextParam: string | null | undefined, role: AppRole | null): string {
  const fallback = homePathForRole(role);
  if (nextParam == null || nextParam === "") return fallback;
  const trimmed = nextParam.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (!roleAllowsPath(role, trimmed)) return fallback;
  return trimmed;
}

export type RouteAccess = "public" | "allow" | "login" | "forbidden";

export function evaluateRouteAccess(pathname: string, user: User | null): RouteAccess {
  if (!isAuthRequiredPath(pathname)) return "public";
  if (!user) return "login";
  const role = parseAppRole(user);
  if (!roleAllowsPath(role, pathname)) return "forbidden";
  return "allow";
}
