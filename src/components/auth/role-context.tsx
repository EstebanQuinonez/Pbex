"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppRole } from "@/lib/auth/roles";
import {
  homePathForRole,
  isAdmin,
  isEncargadoLinea,
  isGerente,
  isVentas,
  roleAllowsPath,
} from "@/lib/auth/roles";

type RoleContextValue = {
  role: AppRole | null;
  homePath: string;
  isAdmin: boolean;
  isGerente: boolean;
  isEncargadoLinea: boolean;
  isVentas: boolean;
  canAccessPath: (pathname: string) => boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  role,
  children,
}: {
  role: AppRole | null;
  children: ReactNode;
}) {
  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      homePath: homePathForRole(role),
      isAdmin: isAdmin(role),
      isGerente: isGerente(role),
      isEncargadoLinea: isEncargadoLinea(role),
      isVentas: isVentas(role),
      canAccessPath: (pathname: string) => roleAllowsPath(role, pathname),
    }),
    [role],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useAppRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useAppRole debe usarse dentro de RoleProvider (layout protegido).");
  }
  return ctx;
}
