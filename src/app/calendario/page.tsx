import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format, isPast, isToday, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";

type CalendarEvent = {
  id: string;
  projectId: string;
  projectName: string;
  date: Date;
  type: string;
  label: string;
  color: string;
};

export default async function CalendarioPage() {
  const projects = await prisma.project.findMany({
    where: {
      status: {
        in: ["IDEA", "EN_PROCESO"],
      },
    },
  });

  const events: CalendarEvent[] = [];

  projects.forEach((p) => {
    if (p.callDate) events.push({ id: `${p.id}-call`, projectId: p.id, projectName: p.title, date: p.callDate, type: "callDate", label: "Publicación de Convocatoria", color: "bg-purple-100 text-purple-700 border-purple-200" });
    if (p.presentationDate) events.push({ id: `${p.id}-pres`, projectId: p.id, projectName: p.title, date: p.presentationDate, type: "presentationDate", label: "Límite Presentación", color: "bg-indigo-100 text-indigo-700 border-indigo-200" });
    if (p.resolutionDate) events.push({ id: `${p.id}-res`, projectId: p.id, projectName: p.title, date: p.resolutionDate, type: "resolutionDate", label: "Resolución", color: "bg-blue-100 text-blue-700 border-blue-200" });
    if (p.startDate) events.push({ id: `${p.id}-start`, projectId: p.id, projectName: p.title, date: p.startDate, type: "startDate", label: "Inicio Ejecución", color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
    if (p.endDate) events.push({ id: `${p.id}-end`, projectId: p.id, projectName: p.title, date: p.endDate, type: "endDate", label: "Fin Ejecución", color: "bg-green-100 text-green-700 border-green-200" });
    if (p.publicityDate) events.push({ id: `${p.id}-pub`, projectId: p.id, projectName: p.title, date: p.publicityDate, type: "publicityDate", label: "Publicidad / Difusión", color: "bg-orange-100 text-orange-700 border-orange-200" });
    if (p.justificationDate) events.push({ id: `${p.id}-just`, projectId: p.id, projectName: p.title, date: p.justificationDate, type: "justificationDate", label: "Límite Justificación", color: "bg-red-100 text-red-700 border-red-200 font-bold" });
  });

  // Sort by date ascending
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Filter out very old events (more than 30 days ago) to keep list relevant
  const thirtyDaysAgo = addDays(new Date(), -30);
  const relevantEvents = events.filter(e => e.date >= thirtyDaysAgo);

  const groupedEvents = relevantEvents.reduce((acc, event) => {
    const monthYear = format(event.date, "MMMM yyyy", { locale: es });
    const capitalizedStr = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    if (!acc[capitalizedStr]) {
      acc[capitalizedStr] = [];
    }
    acc[capitalizedStr].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-indigo-600" />
          Calendario Global
        </h1>
        <p className="text-gray-500 mt-1">Próximos hitos y fechas límite de todos los proyectos activos.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {relevantEvents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">Agenda Despejada</p>
            <p className="mt-1">No hay fechas próximamente para los proyectos en curso.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {Object.entries(groupedEvents).map(([month, monthEvents], index) => (
              <div key={month}>
                <div className={`bg-indigo-50/50 border-gray-200 px-6 py-3 ${index > 0 ? 'border-y' : 'border-b'}`}>
                  <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">{month}</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {monthEvents.map((event) => {
                    const past = isPast(event.date) && !isToday(event.date);
                    const today = isToday(event.date);
                    
                    return (
                      <div key={event.id} className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-gray-50 transition-colors ${past ? 'opacity-60' : ''}`}>
                        
                        <div className="sm:w-32 flex-shrink-0">
                          <div className={`text-sm font-bold ${today ? 'text-indigo-600' : (past ? 'text-gray-400' : 'text-gray-900')}`}>
                            {format(event.date, "dd MMM yyyy", { locale: es })}
                          </div>
                          {today && <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded mt-1 inline-block shadow-sm">HOY</span>}
                          {past && <span className="text-xs font-medium text-gray-500 mt-1 inline-block">Pasado</span>}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 text-xs rounded border ${event.color}`}>
                              {event.label}
                            </span>
                            {event.type === 'justificationDate' && !past && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <Link 
                            href={`/proyectos/${event.projectId}`}
                            className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors inline-block"
                          >
                            {event.projectName}
                          </Link>
                        </div>

                        <div className="sm:w-32 flex-shrink-0 sm:text-right">
                          <Link 
                            href={`/proyectos/${event.projectId}`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Ver Proyecto &rarr;
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
