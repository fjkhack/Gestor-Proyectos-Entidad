"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/app/actions/project-actions";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function DeleteProjectButton({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteProject(projectId);
    if (result.success) {
      showToast("Proyecto eliminado correctamente.", "success");
      router.push("/proyectos");
    } else {
      showToast(result.error ?? "Error al eliminar", "error");
      setIsPending(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" /> Eliminar Proyecto
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !isPending && setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">¿Eliminar proyecto?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Estás a punto de eliminar <strong className="text-gray-900">&quot;{projectTitle}&quot;</strong>.
                Se borrarán todas sus tareas, participantes, gastos, ingresos y documentos asociados.
              </p>
              <p className="text-xs text-red-600 font-semibold mt-2">⚠️ Esta acción no se puede deshacer.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="px-6 py-2.5 rounded-lg text-white bg-red-600 hover:bg-red-700 font-medium transition-colors text-sm disabled:opacity-50"
              >
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
