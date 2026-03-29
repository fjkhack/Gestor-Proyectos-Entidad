"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

type InlineDeleteButtonProps = {
  onConfirm: () => Promise<unknown>;
  itemName?: string;
};

export function InlineDeleteButton({ onConfirm, itemName = "este elemento" }: InlineDeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-red-600 font-medium whitespace-nowrap">¿Eliminar {itemName}?</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await onConfirm();
            setShowConfirm(false);
          });
        }}
        className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
      >
        {isPending ? "..." : "Sí"}
      </button>
      <button
        type="button"
        onClick={() => setShowConfirm(false)}
        className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium"
      >
        No
      </button>
    </div>
  );
}
