"use client";

import Link from "next/link";
import { CreditCard, FolderOpen, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { SearchInput, FilterSelect, EmptyState } from "@/components/ui/FormControls";
import { formatCurrency, getExpenseCategoryInfo, EXPENSE_CATEGORIES } from "@/lib/constants";
import { exportToCSV } from "@/lib/export";

type ExpenseRow = {
  id: string;
  concept: string;
  amount: number;
  date: string;
  invoiceNum: string | null;
  category: string;
  projectId: string;
  projectTitle: string;
};

export function GastosClient({ expenses }: { expenses: ExpenseRow[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = expenses.filter(e => {
    const matchSearch = e.concept.toLowerCase().includes(search.toLowerCase()) ||
      e.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      (e.invoiceNum ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || e.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);

  const handleExport = () => {
    exportToCSV("gastos", ["Concepto", "Categoría", "Importe", "Fecha", "Nº Factura", "Proyecto"], filtered.map(e => [
      e.concept,
      getExpenseCategoryInfo(e.category).label,
      e.amount.toString(),
      format(new Date(e.date), "dd/MM/yyyy"),
      e.invoiceNum ?? "",
      e.projectTitle,
    ]));
  };

  const categoryOptions = Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => ({
    value: key, label: val.label,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-indigo-600" />
            Registro Global de Gastos
          </h1>
          <p className="text-gray-500 mt-1">Historial completo de gastos y facturas en todos los proyectos.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-right min-w-[200px]">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Filtrado</p>
          <p className="text-2xl font-bold text-indigo-900">{formatCurrency(totalFiltered)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por concepto, factura o proyecto..." className="flex-1 w-full sm:w-auto" />
        <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} allLabel="Todas las categorías" />
        <button onClick={handleExport} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-12 h-12" />}
            title={expenses.length === 0 ? "Sin gastos registrados" : "Sin resultados"}
            description={expenses.length === 0 ? "Los gastos se añaden desde la ficha individual de cada proyecto." : "Prueba con otros términos de búsqueda o filtros."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Concepto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Importe</th>
                  <th className="px-6 py-4">Proyecto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((exp) => {
                  const catInfo = getExpenseCategoryInfo(exp.category);
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors text-sm">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div>{exp.concept}</div>
                        {exp.invoiceNum && (
                          <div className="text-xs text-gray-500 mt-1 font-normal bg-gray-100 inline-block px-2 py-0.5 rounded">
                            Fact: {exp.invoiceNum}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded font-semibold ${catInfo.style}`}>
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {format(new Date(exp.date), "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/proyectos/${exp.projectId}`} className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          {exp.projectTitle}
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
      <p className="text-xs text-gray-400 text-right">{filtered.length} de {expenses.length} gastos</p>
    </div>
  );
}
