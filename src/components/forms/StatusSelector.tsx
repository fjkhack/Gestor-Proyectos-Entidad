"use client"

import { useTransition } from "react"
import { updateProjectStatus } from "@/app/actions/project-actions"
import { getStatusInfo, PROJECT_STATUSES } from "@/lib/constants"
import { useToast } from "@/components/ui/Toast"

export function StatusSelector({ projectId, currentStatus }: { projectId: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const statusInfo = getStatusInfo(currentStatus);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(async () => {
      const result = await updateProjectStatus(projectId, newStatus);
      if (result.success) {
        showToast("Estado actualizado.", "success");
      } else {
        showToast(result.error ?? "Error al cambiar estado", "error");
      }
    });
  }

  return (
    <select
      value={currentStatus}
      onChange={handleStatusChange}
      disabled={isPending}
      className={`text-sm font-semibold rounded-full px-3 py-1 outline-none border transition-colors cursor-pointer appearance-none text-center ${statusInfo.color} ${isPending ? 'opacity-50' : ''}`}
      style={{
         WebkitAppearance: "none",
         MozAppearance: "none" as unknown as undefined,
         paddingRight: "1.5rem"
      }}
    >
      {Object.entries(PROJECT_STATUSES).map(([key, val]) => (
        <option key={key} value={key}>{val.label}</option>
      ))}
    </select>
  )
}
