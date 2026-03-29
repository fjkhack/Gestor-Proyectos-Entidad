"use client";

import Link from "next/link";
import { TrendingUp, FolderOpen, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { SearchInput, FilterSelect, EmptyState } from "@/components/ui/FormControls";
import { formatCurrency, getIncomeTypeInfo, INCOME_TYPES } from "@/lib/constants";
import { exportToCSV } from "@/lib/export";

type IncomeRow = {
  id: string;
  concept: string;
  amount: number;
  date: string;
  type: string;
  contributor: string | null;
  projectId: string;
  projectTitle: string;
};

export function IngresosClient({ incomes }: { incomes: IncomeRow[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = incomes.filter(i => {
    const matchSearch = i.concept.toLowerCase().includes(search.toLowerCase()) ||
      i.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      (i.contributor ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || i.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalFiltered = filtered.reduce((sum, i) => sum + i.amount, 0);

  const handleExport = () => {
    exportToCSV("ingresos", ["Concepto", "Tipo", "Aportante", "Importe", "Fecha", "Proyecto"], filtered.map(i => [
      i.concept,
      getIncomeTypeInfo(i.type).label,
      i.contributor ?? "",
      i.amount.toString(),
      format(new Date(i.date), "dd/MM/yyyy"),
      i.projectTitle,
    ]));
  };

  const typeOptions = Object.entries(INCOME_TYPES).map(([key, val]) => ({
    value: key, label: val.label,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            Registro Global de Ingresos
          </h1>
          <p className="text-gray-500 mt-1">Subvenciones, colaboraciones, ventas y aportaciones de todos los proyectos.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-right min-w-[200px]">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Filtrado</p>
          <p className="text-2xl font-bold text-emerald-900">{formatCurrency(totalFiltered)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por concepto, aportante o proyecto..." className="flex-1 w-full sm:w-auto" />
        <FilterSelect value={typeFilter} onChange={setTypeFilter} options={typeOptions} allLabel="Todos los tipos" />
        <button onClick={handleExport} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="w-12 h-12" />}
            title={incomes.length === 0 ? "Sin ingresos registrados" : "Sin resultados"}
            description={incomes.length === 0 ? "Los ingresos y aportaciones se añaden desde la ficha individual de cada proyecto." : "Prueba con otros términos de búsqueda o filtros."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Concepto</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Aportante</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Importe</th>
                  <th className="px-6 py-4">Proyecto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inc) => {
                  const typeInfo = getIncomeTypeInfo(inc.type);
                  return (
                    <tr key={inc.id} className="hover:bg-gray-50 transition-colors text-sm">
                      <td className="px-6 py-4 font-semibold text-gray-900">{inc.concept}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded font-semibold ${typeInfo.style}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{inc.contributor || <span className="text-gray-300">-</span>}</td>
                      <td className="px-6 py-4 text-gray-600">{format(new Date(inc.date), "dd MMM yyyy", { locale: es })}</td>
                      <td className="px-6 py-4 font-bold text-emerald-700">+{formatCurrency(inc.amount)}</td>
                      <td className="px-6 py-4">
                        <Link href={`/proyectos/${inc.projectId}`} className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          {inc.projectTitle}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-right">{filtered.length} de {incomes.length} ingresos</p>
    </div>
  );
}
