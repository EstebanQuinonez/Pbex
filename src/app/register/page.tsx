import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">Crear cuenta</h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Crea tu acceso con correo electrónico y una contraseña segura.
        </p>
        <div className="mt-8">
          <RegisterForm />
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
