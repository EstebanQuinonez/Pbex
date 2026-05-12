import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { parseAppRole, resolvePostLoginRedirect } from "@/lib/auth/roles";

type SearchParams = Promise<{ next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const nextPath = params.next?.trim() || null;

  if (user) {
    redirect(resolvePostLoginRedirect(nextPath, parseAppRole(user)));
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">Iniciar sesión</h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Accede con tu cuenta de Supabase Auth.
        </p>
        <div className="mt-8">
          <LoginForm nextPath={nextPath} />
        </div>
        <p className="mt-8 text-center text-xs text-zinc-500">
          <Link href="/" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
