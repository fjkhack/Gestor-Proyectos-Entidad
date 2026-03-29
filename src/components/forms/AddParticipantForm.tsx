"use client";

import { useRef, useTransition } from "react";
import { addParticipant } from "@/app/actions/participant-expense-actions";
import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";

export function AddParticipantForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await addParticipant(projectId, formData);
      if (result.success) {
        formRef.current?.reset();
        showToast("Participante añadido correctamente.", "success");
      } else {
        showToast(result.error ?? "Error al añadir participante", "error");
      }
    });
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row gap-3 items-end"
    >
      <div className="flex-1 w-full space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Nombre</label>
        <input required type="text" name="name" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 transition-colors" placeholder="Nombre completo o entidad" />
      </div>

      <div className="w-full sm:w-44 space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Rol</label>
        <select required name="role" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 bg-white transition-colors">
          <option value="PROFESIONAL">Profesional</option>
          <option value="VOLUNTARIO">Voluntario</option>
          <option value="ENTIDAD_COLABORADORA">Entidad Colaboradora</option>
        </select>
      </div>

      <div className="w-full sm:w-44 space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
        <input type="email" name="email" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 transition-colors" placeholder="correo@ejemplo.es" />
      </div>

      <div className="w-full sm:w-36 space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Teléfono</label>
        <input type="tel" name="phone" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 transition-colors" placeholder="600 123 456" />
      </div>

      <SubmitButton pending={isPending} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
        <Plus className="w-4 h-4" /> Añadir
      </SubmitButton>
    </form>
  );
}
