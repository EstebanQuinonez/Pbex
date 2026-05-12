import { Navbar } from "@/components/layout/Navbar";
import { RoleProvider } from "@/components/auth/role-context";
import type { AppRole } from "@/lib/auth/roles";

export function ProtectedShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: AppRole | null;
}) {
  return (
    <RoleProvider role={role}>
      <div className="flex min-h-full flex-1 flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </div>
    </RoleProvider>
  );
}
