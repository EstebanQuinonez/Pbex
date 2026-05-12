import { DefectForm } from "@/components/forms/DefectForm";
import { ProductionForm } from "@/components/forms/ProductionForm";

export default function RegistroPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Registros de planta
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Cada envío crea una fila en <code className="text-xs">eventos</code> con <code className="text-xs">type</code>{" "}
          y carga útil JSON.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductionForm />
        <DefectForm />
      </div>
    </div>
  );
}
