"use client";

import { useState, useTransition } from "react";
import { updateProject } from "@/app/actions/project-actions";
import { Pencil, X, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/constants";

type ProjectData = {
  id: string;
  title: string;
  idea: string | null;
  need: string | null;
  objectives: string | null;
  budget: number | null;
};

export function EditProjectForm({ project }: { project: ProjectData }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            Información Principal
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Idea Original</h3>
            <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
              {project.idea || "No se ha detallado la idea."}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Necesidad</h3>
            <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
              {project.need || "No se ha detallado la necesidad."}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Objetivos</h3>
            <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap">
              {project.objectives || "No se han detallado objetivos."}
            </p>
          </div>
          {project.budget != null && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Presupuesto Estimado</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 font-semibold text-indigo-700">
                {formatCurrency(project.budget)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProject(project.id, formData);
      if (result.success) {
        setEditing(false);
        showToast("Proyecto actualizado correctamente.", "success");
      } else {
        showToast(result.error ?? "Error al guardar", "error");
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Editar Información</h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Título *</label>
          <input
            name="title"
            defaultValue={project.title}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Idea Original</label>
          <textarea
            name="idea"
            defaultValue={project.idea ?? ""}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Necesidad</label>
          <textarea
            name="need"
            defaultValue={project.need ?? ""}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Objetivos</label>
          <textarea
            name="objectives"
            defaultValue={project.objectives ?? ""}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Presupuesto Estimado (€)</label>
          <input
            name="budget"
            type="number"
            step="0.01"
            min="0"
            defaultValue={project.budget ?? ""}
            className="w-full sm:w-48 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors text-sm disabled:opacity-50"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Guardar Cambios
            </>
          )}
        </button>
      </div>
    </form>
  );
}
