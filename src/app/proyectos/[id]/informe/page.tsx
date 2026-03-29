import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const typeLabels: Record<string, string> = {
  SUBVENCION: "Subvención",
  COLABORACION: "Colaboración",
  VENTA: "Venta / Actividad",
  OTRO: "Otro",
};

export default async function InformePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      incomes: { orderBy: { date: "asc" } },
      expenses: { orderBy: { date: "asc" } },
    },
  });

  if (!project) notFound();

  const totalIncome = project.incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = project.expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  // --- Agrupar ingresos por aportante ---
  const incomeByContributor: Record<string, { items: typeof project.incomes; total: number }> = {};
  project.incomes.forEach((inc) => {
    const key = inc.contributor || "Sin identificar";
    if (!incomeByContributor[key]) incomeByContributor[key] = { items: [], total: 0 };
    incomeByContributor[key].items.push(inc);
    incomeByContributor[key].total += inc.amount;
  });

  // --- Agrupar gastos por nº factura / concepto (invoiceNum como identificador de proveedor) ---
  const expenseByProvider: Record<string, { items: typeof project.expenses; total: number }> = {};
  project.expenses.forEach((exp) => {
    const key = exp.invoiceNum ? `Fact. ${exp.invoiceNum}` : exp.concept;
    if (!expenseByProvider[key]) expenseByProvider[key] = { items: [], total: 0 };
    expenseByProvider[key].items.push(exp);
    expenseByProvider[key].total += exp.amount;
  });

  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2 });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-4 border-b pb-6 print:border-none">
        <div className="flex items-center gap-4">
          <Link href={`/proyectos/${id}`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors print:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Informe Financiero</p>
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Generado el {format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</p>
          </div>
        </div>
        <PrintButton />
      </div>

      {/* RESUMEN GENERAL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
          <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
          <p className="text-xs font-bold text-emerald-600 uppercase">Total Ingresos</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{fmt(totalIncome)} €</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
          <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-1" />
          <p className="text-xs font-bold text-red-600 uppercase">Total Gastos</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{fmt(totalExpense)} €</p>
        </div>
        <div className={`border rounded-xl p-5 text-center ${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <BarChart3 className={`w-6 h-6 mx-auto mb-1 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          <p className={`text-xs font-bold uppercase ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance Neto</p>
          <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>{balance >= 0 ? '+' : ''}{fmt(balance)} €</p>
        </div>
      </div>

      {/* DESGLOSE DE INGRESOS POR APORTANTE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-emerald-600 text-white px-6 py-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Detalle de Ingresos por Aportante
          </h2>
        </div>

        {project.incomes.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">No se han registrado ingresos en este proyecto.</p>
        ) : (
          <div>
            {Object.entries(incomeByContributor).map(([contributor, data]) => (
              <div key={contributor} className="border-b border-gray-100 last:border-b-0">
                <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-sm">👤 {contributor}</span>
                  <span className="font-bold text-emerald-700 text-sm">Subtotal: {fmt(data.total)} €</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="px-6 py-2 text-left font-medium">Concepto</th>
                      <th className="px-6 py-2 text-left font-medium">Tipo</th>
                      <th className="px-6 py-2 text-left font-medium">Fecha</th>
                      <th className="px-6 py-2 text-right font-medium">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.items.map((inc) => (
                      <tr key={inc.id}>
                        <td className="px-6 py-2 text-gray-900">{inc.concept}</td>
                        <td className="px-6 py-2 text-gray-600">{typeLabels[inc.type] || inc.type}</td>
                        <td className="px-6 py-2 text-gray-600">{format(new Date(inc.date), "dd/MM/yyyy")}</td>
                        <td className="px-6 py-2 text-right font-semibold text-emerald-700">+{fmt(inc.amount)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div className="bg-emerald-50 px-6 py-4 flex justify-between items-center border-t border-emerald-200">
              <span className="font-bold text-emerald-900 uppercase text-sm">Total Ingresos</span>
              <span className="text-xl font-bold text-emerald-900">{fmt(totalIncome)} €</span>
            </div>
          </div>
        )}
      </div>

      {/* DESGLOSE DE GASTOS POR PROVEEDOR / FACTURA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-red-600 text-white px-6 py-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingDown className="w-5 h-5" /> Detalle de Gastos por Concepto / Factura
          </h2>
        </div>

        {project.expenses.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">No se han registrado gastos en este proyecto.</p>
        ) : (
          <div>
            {Object.entries(expenseByProvider).map(([provider, data]) => (
              <div key={provider} className="border-b border-gray-100 last:border-b-0">
                <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-sm">🏷️ {provider}</span>
                  <span className="font-bold text-red-700 text-sm">Subtotal: {fmt(data.total)} €</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="px-6 py-2 text-left font-medium">Concepto</th>
                      <th className="px-6 py-2 text-left font-medium">Factura</th>
                      <th className="px-6 py-2 text-left font-medium">Fecha</th>
                      <th className="px-6 py-2 text-right font-medium">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.items.map((exp) => (
                      <tr key={exp.id}>
                        <td className="px-6 py-2 text-gray-900">{exp.concept}</td>
                        <td className="px-6 py-2 text-gray-600">{exp.invoiceNum || "-"}</td>
                        <td className="px-6 py-2 text-gray-600">{format(new Date(exp.date), "dd/MM/yyyy")}</td>
                        <td className="px-6 py-2 text-right font-semibold text-red-700">-{fmt(exp.amount)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div className="bg-red-50 px-6 py-4 flex justify-between items-center border-t border-red-200">
              <span className="font-bold text-red-900 uppercase text-sm">Total Gastos</span>
              <span className="text-xl font-bold text-red-900">{fmt(totalExpense)} €</span>
            </div>
          </div>
        )}
      </div>

      {/* BALANCE FINAL */}
      <div className={`rounded-xl p-6 text-center border-2 ${balance >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
        <p className="text-sm font-bold uppercase text-gray-600 mb-2">Resultado Final del Proyecto</p>
        <p className={`text-4xl font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
          {balance >= 0 ? '+' : ''}{fmt(balance)} €
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {balance >= 0 ? 'El proyecto tiene un saldo favorable.' : 'El proyecto tiene un déficit que cubrir.'}
        </p>
      </div>


    </div>
  );
}
