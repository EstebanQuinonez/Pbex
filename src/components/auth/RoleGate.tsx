"use client";

import type { AppRole } from "@/lib/auth/roles";
import { useAppRole } from "@/components/auth/role-context";

type RoleGateProps = {
  /** Si el rol actual está en la lista, se renderiza `children`. */
  allow: readonly AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { role } = useAppRole();
  if (!role || !(allow as readonly string[]).includes(role)) {
    return fallback;
  }
  return children;
}
