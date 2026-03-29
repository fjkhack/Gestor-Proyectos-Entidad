"use client";

import Link from "next/link";
import { Users, FolderOpen, Download } from "lucide-react";
import { useState } from "react";
import { SearchInput, FilterSelect, EmptyState } from "@/components/ui/FormControls";
import { PARTICIPANT_ROLES } from "@/lib/constants";
import { exportToCSV } from "@/lib/export";

type ParticipantRow = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  projectId: string;
  projectTitle: string;
};

export function ParticipantesClient({ participants }: { participants: ParticipantRow[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filtered = participants.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleExport = () => {
    exportToCSV("participantes", ["Nombre", "Rol", "Email", "Teléfono", "Proyecto"], filtered.map(p => [
      p.name,
      PARTICIPANT_ROLES[p.role as keyof typeof PARTICIPANT_ROLES] ?? p.role,
      p.email ?? "",
      p.phone ?? "",
      p.projectTitle,
    ]));
  };

  const roleOptions = Object.entries(PARTICIPANT_ROLES).map(([key, label]) => ({
    value: key, label,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-600" />
          Directorio de Participantes
        </h1>
        <p className="text-gray-500 mt-1">Listado global de profesionales, voluntarios y entidades vinculadas a todos los proyectos.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, email o proyecto..." className="flex-1 w-full sm:w-auto" />
        <FilterSelect value={roleFilter} onChange={setRoleFilter} options={roleOptions} allLabel="Todos los roles" />
        <button onClick={handleExport} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={participants.length === 0 ? "Aún no hay participantes" : "Sin resultados"}
            description={participants.length === 0 ? "Añade participantes entrando a la ficha de cada proyecto individualmente." : "Prueba con otros términos de búsqueda o filtros."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Nombre / Entidad</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Proyecto Asociado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-semibold text-gray-900">{p.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                        {PARTICIPANT_ROLES[p.role as keyof typeof PARTICIPANT_ROLES] ?? p.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {p.email && <div className="truncate max-w-[200px]">{p.email}</div>}
                      {p.phone && <div>{p.phone}</div>}
                      {!p.email && !p.phone && <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/proyectos/${p.projectId}`} className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        {p.projectTitle}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-right">{filtered.length} de {participants.length} participantes</p>
    </div>
  );
}
