"use client";

import { useRef, useTransition } from "react";
import { addAction } from "@/app/actions/task-actions";
import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";

type Participant = {
  id: string;
  name: string;
  role: string;
};

export function AddActionForm({ projectId, participants }: { projectId: string; participants: Participant[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await addAction(projectId, formData);
      if (result.success) {
        formRef.current?.reset();
        showToast("Tarea añadida correctamente.", "success");
      } else {
        showToast(result.error ?? "Error al añadir tarea", "error");
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
        <label className="text-xs font-semibold text-gray-500 uppercase">Tarea a realizar</label>
        <input required type="text" name="title" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 transition-colors" placeholder="Ej: Contactar con prensa" />
      </div>

      <div className="w-full sm:w-40 space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Fecha Límite</label>
        <input type="date" name="date" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 transition-colors" />
      </div>

      <div className="w-full sm:w-48 space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Asignar A</label>
        <select name="participantId" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 bg-white transition-colors">
          <option value="none">-- Sin asignar --</option>
          {participants.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <SubmitButton pending={isPending} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
        <Plus className="w-4 h-4" /> Añadir Tarea
      </SubmitButton>
    </form>
  );
}
