"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

type ConfirmDeleteButtonProps = {
  title?: string;
  message: string | ReactNode;
  onConfirm: () => Promise<void>;
  children?: ReactNode;
  buttonClassName?: string;
};

export function ConfirmDeleteButton({
  title = "¿Estás seguro?",
  message,
  onConfirm,
  children,
  buttonClassName,
}: ConfirmDeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={buttonClassName ?? "p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"}
        title="Eliminar"
      >
        {children ?? <Trash2 className="w-4 h-4" />}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !isPending && setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-md w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <div className="text-sm text-gray-500 mt-2">{message}</div>
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
                onClick={() => {
                  startTransition(async () => {
                    await onConfirm();
                    setShowConfirm(false);
                  });
                }}
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
