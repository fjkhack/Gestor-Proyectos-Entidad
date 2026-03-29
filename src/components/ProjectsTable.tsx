"use client";

import Link from "next/link";
import { Plus, FolderOpen, Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StatusSelector } from "@/components/forms/StatusSelector";
import { SearchInput, FilterSelect, EmptyState } from "@/components/ui/FormControls";
import { useState } from "react";
import { getStatusInfo, PROJECT_STATUSES, formatCurrency } from "@/lib/constants";
import { exportToCSV } from "@/lib/export";

type ProjectRow = {
  id: string;
  title: string;
  idea: string | null;
  status: string;
  budget: number | null;
  createdAt: string;
};

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.idea ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    exportToCSV("proyectos", ["Título", "Estado", "Presupuesto", "Fecha Creación"], filtered.map(p => [
      p.title,
      getStatusInfo(p.status).shortLabel,
      p.budget != null ? formatCurrency(p.budget) : "-",
      format(new Date(p.createdAt), "dd/MM/yyyy"),
    ]));
  };

  const statusOptions = Object.entries(PROJECT_STATUSES).map(([key, val]) => ({
    value: key,
    label: val.shortLabel,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por título o idea..." className="flex-1 w-full sm:w-auto" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} allLabel="Todos los estados" />
        <button onClick={handleExport} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-12 h-12" />}
            title={projects.length === 0 ? "Aún no hay proyectos" : "Sin resultados"}
            description={projects.length === 0 ? "Crea tu primer proyecto para empezar a gestionarlo." : "Prueba con otros términos de búsqueda o filtros."}
            action={projects.length === 0 ? (
              <Link href="/proyectos/nuevo" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
                <Plus className="w-5 h-5" /> Crear Proyecto
              </Link>
            ) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Nombre del Proyecto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Presupuesto</th>
                  <th className="px-6 py-4">Fecha Creación</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/proyectos/${project.id}`} className="font-bold text-indigo-700 hover:text-indigo-900 hover:underline block mb-1">
                        {project.title}
                      </Link>
                      {project.idea && (
                        <div className="text-sm text-gray-500 truncate max-w-md">{project.idea}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusSelector projectId={project.id} currentStatus={project.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {project.budget != null ? formatCurrency(project.budget) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(project.createdAt), "dd MMM yyyy", { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/proyectos/${project.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-right">{filtered.length} de {projects.length} proyectos</p>
    </div>
  );
}
