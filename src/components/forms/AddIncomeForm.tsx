"use client";

import { useRef, useTransition } from "react";
import { addIncome } from "@/app/actions/income-actions";
import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";

export function AddIncomeForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await addIncome(projectId, formData);
      if (result.success) {
        formRef.current?.reset();
        showToast("Ingreso registrado correctamente.", "success");
      } else {
        showToast(result.error ?? "Error al registrar ingreso", "error");
      }
    });
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3"
    >
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Concepto</label>
          <input required type="text" name="concept" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500 transition-colors" placeholder="Ej: Subvención Diputación 2026" />
        </div>

        <div className="w-full sm:w-36 space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Tipo</label>
          <select required name="type" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500 bg-white transition-colors">
            <option value="SUBVENCION">Subvención</option>
            <option value="COLABORACION">Colaboración</option>
            <option value="VENTA">Venta / Actividad</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div className="w-full sm:w-32 space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Importe (€)</label>
          <input required type="number" step="0.01" min="0.01" name="amount" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500 transition-colors" placeholder="0.00" />
        </div>

        <div className="w-full sm:w-40 space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Fecha</label>
          <input required type="date" name="date" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500 transition-colors" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Aportante (Entidad / Persona)</label>
          <input type="text" name="contributor" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500 transition-colors" placeholder="Ej: Generalitat Valenciana, Juan García..." />
        </div>

        <SubmitButton pending={isPending} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4" /> Registrar Ingreso
        </SubmitButton>
      </div>
    </form>
  );
}
