import { prisma } from "@/lib/prisma"
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarDays,
  TrendingUp,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { format, isPast, isToday, addDays, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency, getStatusInfo } from "@/lib/constants"

type AlertEvent = {
  id: string;
  projectId: string;
  projectName: string;
  date: Date;
  type: string;
  label: string;
};

export default async function Dashboard() {
  const projects = await prisma.project.findMany({
    include: {
      actions: true,
      expenses: true,
      incomes: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const total = projects.length
  const enProceso = projects.filter(p => p.status === "EN_PROCESO").length
  const completados = projects.filter(p => p.status === "COMPLETADO").length
  const ideas = projects.filter(p => p.status === "IDEA").length

  // Financial totals
  const totalExpenses = projects.reduce((sum, p) => sum + p.expenses.reduce((s: number, e: { amount: number }) => s + e.amount, 0), 0);
  const totalIncomes = projects.reduce((sum, p) => sum + p.incomes.reduce((s: number, i: { amount: number }) => s + i.amount, 0), 0);
  const balance = totalIncomes - totalExpenses;

  // Status distribution for chart
  const statusData = [
    { label: "Ideas", count: ideas, color: "bg-purple-500", lightColor: "bg-purple-100 text-purple-700" },
    { label: "En Proceso", count: enProceso, color: "bg-blue-500", lightColor: "bg-blue-100 text-blue-700" },
    { label: "Completados", count: completados, color: "bg-green-500", lightColor: "bg-green-100 text-green-700" },
    { label: "Cancelados", count: projects.filter(p => p.status === "CANCELADO").length, color: "bg-red-500", lightColor: "bg-red-100 text-red-700" },
  ];

  // Alerts
  const activeProjects = projects.filter(p => p.status === "IDEA" || p.status === "EN_PROCESO");
  const upcomingEvents: AlertEvent[] = [];
  const today = new Date();
  const next30Days = addDays(today, 30);

  activeProjects.forEach((p) => {
    const dates = [
      { date: p.callDate, type: "callDate", label: "Publicación Convocatoria" },
      { date: p.presentationDate, type: "presentationDate", label: "Límite Presentación" },
      { date: p.resolutionDate, type: "resolutionDate", label: "Resolución" },
      { date: p.startDate, type: "startDate", label: "Inicio Ejecución" },
      { date: p.endDate, type: "endDate", label: "Fin Ejecución" },
      { date: p.publicityDate, type: "publicityDate", label: "Publicidad / Difusión" },
      { date: p.justificationDate, type: "justificationDate", label: "Límite Justificación" },
    ];

    dates.forEach(d => {
      if (d.date) {
        const isRecentPast = isPast(d.date) && isBefore(addDays(today, -60), d.date);
        const isUpcoming = !isPast(d.date) && isBefore(d.date, next30Days);
        if (isRecentPast || isUpcoming || isToday(d.date)) {
          upcomingEvents.push({
            id: `${p.id}-${d.type}`,
            projectId: p.id,
            projectName: p.title,
            date: d.date,
            type: d.type,
            label: d.label
          })
        }
      }
    });
  });

  upcomingEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Proyectos</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">En Proceso</p>
            <p className="text-2xl font-bold text-gray-900">{enProceso}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Completados</p>
            <p className="text-2xl font-bold text-gray-900">{completados}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ideas</p>
            <p className="text-2xl font-bold text-gray-900">{ideas}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Distribución por Estado</h2>
          {total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {statusData.filter(s => s.count > 0).map(s => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{s.label}</span>
                    <span className="text-gray-500">{s.count} ({((s.count / total) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${s.color} transition-all`} style={{ width: `${(s.count / total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen Financiero Global</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Total Ingresos</p>
                <p className="text-lg font-bold text-emerald-700">+{formatCurrency(totalIncomes)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Total Gastos</p>
                <p className="text-lg font-bold text-red-600">-{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
            <div className={`pt-3 border-t flex justify-between items-center ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              <span className="font-bold">Balance Neto</span>
              <span className="text-xl font-bold">{balance >= 0 ? '+' : ''}{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>

        {/* Top projects by expenses */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Proyectos por Gasto</h2>
          {totalExpenses === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin gastos registrados</p>
          ) : (
            <div className="space-y-3">
              {projects
                .map(p => ({ title: p.title, id: p.id, total: p.expenses.reduce((s: number, e: { amount: number }) => s + e.amount, 0) }))
                .filter(p => p.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map(p => (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <Link href={`/proyectos/${p.id}`} className="font-medium text-gray-700 hover:text-indigo-600 truncate max-w-[180px]">{p.title}</Link>
                      <span className="text-gray-500 flex-shrink-0 ml-2">{formatCurrency(p.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${(p.total / totalExpenses) * 100}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects + Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Proyectos Recientes</h2>
          {projects.length === 0 ? (
            <p className="text-gray-500">No hay proyectos todavía. ¡Empieza creando uno!</p>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map(project => (
                <div key={project.id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg border border-gray-50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.title}</h3>
                    <p className="text-sm text-gray-500">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusInfo(project.status).color}`}>
                        {getStatusInfo(project.status).shortLabel}
                      </span>
                    </p>
                  </div>
                  <Link href={`/proyectos/${project.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    Ver Detalles →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 border-b pb-2 w-full">
              <CalendarDays className="w-5 h-5 text-indigo-500" />
              Alertas y Próximas Fechas
            </h2>
          </div>

          <div className="overflow-y-auto flex-1 pr-2">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 h-full text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-2" />
                <p>No hay alertas próximas en este momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const past = isPast(event.date) && !isToday(event.date);
                  const todayEvent = isToday(event.date);
                  const isJustification = event.type === 'justificationDate';

                  let borderClass = "border-gray-100";
                  let titleClass = "text-gray-900";
                  let badgeClass = "bg-gray-100 text-gray-700";

                  if (past) {
                    borderClass = "border-red-200 bg-red-50";
                    titleClass = "text-red-900";
                    badgeClass = "bg-red-200 text-red-800";
                  } else if (todayEvent) {
                    borderClass = "border-indigo-200 bg-indigo-50";
                    titleClass = "text-indigo-900";
                    badgeClass = "bg-indigo-600 text-white";
                  } else if (isJustification) {
                    borderClass = "border-orange-200 bg-orange-50";
                    titleClass = "text-orange-900";
                    badgeClass = "bg-orange-200 text-orange-800";
                  }

                  return (
                    <div key={event.id} className={`p-4 rounded-lg border ${borderClass} flex flex-col gap-1 transition-all`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeClass}`}>
                          {todayEvent ? "¡HOY!" : past ? "VENCIDO" : "PRONTO"}
                        </span>
                        <span className={`text-xs font-bold ${past ? 'text-red-600' : 'text-gray-500'}`}>
                          {format(event.date, "dd MMM yyyy", { locale: es })}
                        </span>
                      </div>
                      <p className={`font-semibold mt-1 ${titleClass}`}>{event.label}</p>
                      <Link
                        href={`/proyectos/${event.projectId}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 font-medium truncate"
                      >
                        {event.projectName}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
