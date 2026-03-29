"use client";

import { useRef, useTransition } from "react";
import { addDocument } from "@/app/actions/document-actions";
import { Plus } from "lucide-react";
import { SubmitButton } from "@/components/ui/FormControls";
import { useToast } from "@/components/ui/Toast";

export function AddDocumentForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await addDocument(projectId, formData);
      if (result.success) {
        formRef.current?.reset();
        showToast("Documento añadido correctamente.", "success");
      } else {
        showToast(result.error ?? "Error al añadir documento", "error");
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
        <label className="text-xs font-semibold text-gray-500 uppercase">Nombre del Documento</label>
        <input required type="text" name="name" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 transition-colors" placeholder="Ej: Memoria Justificativa" />
      </div>

      <div className="flex-1 w-full space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">URL / Enlace</label>
        <input required type="url" name="url" className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 transition-colors" placeholder="https://drive.google.com/..." />
      </div>

      <SubmitButton pending={isPending} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
        <Plus className="w-4 h-4" /> Adjuntar
      </SubmitButton>
    </form>
  );
}
