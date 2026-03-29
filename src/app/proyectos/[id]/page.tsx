import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Clock, CalendarIcon as CalendarMonth, CheckCircle2, Users, CreditCard, FileText, ExternalLink, TrendingUp, BarChart3, ListTodo } from "lucide-react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AddParticipantForm } from "@/components/forms/AddParticipantForm";
import { AddExpenseForm } from "@/components/forms/AddExpenseForm";
import { removeParticipant, removeExpense } from "@/app/actions/participant-expense-actions";
import { StatusSelector } from "@/components/forms/StatusSelector";
import { AddDocumentForm } from "@/components/forms/AddDocumentForm";
import { removeDocument } from "@/app/actions/document-actions";
import { AddIncomeForm } from "@/components/forms/AddIncomeForm";
import { removeIncome } from "@/app/actions/income-actions";
import { AddActionForm } from "@/components/forms/AddActionForm";
import { toggleAction, removeAction } from "@/app/actions/task-actions";
import { DeleteProjectButton } from "@/components/forms/DeleteProjectButton";
import { EditProjectForm } from "@/components/forms/EditProjectForm";
import { formatCurrency, getIncomeTypeInfo, getExpenseCategoryInfo } from "@/lib/constants";
import { InlineDeleteButton } from "@/components/ui/InlineDeleteButton";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      actions: {
        include: { participant: true },
        orderBy: { date: 'asc' }
      },
      participants: true,
      documents: {
        orderBy: { uploadDate: 'desc' }
      },
      expenses: {
        orderBy: { date: 'desc' }
      },
      incomes: {
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!project) {
    notFound();
  }

  const totalExpenses = project.expenses.reduce((sum: number, exp: { amount: number }) => sum + exp.amount, 0);
  const totalIncomes = project.incomes.reduce((sum: number, inc: { amount: number }) => sum + inc.amount, 0);
  const balance = totalIncomes - totalExpenses;
  const completedActions = project.actions.filter((a: { completed: boolean }) => a.completed).length;
  const totalActions = project.actions.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-6">
        <Link href="/proyectos" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <StatusSelector projectId={project.id} currentStatus={project.status} />
          </div>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm flex-wrap">
            <Clock className="w-4 h-4" />
            Creado el {format(new Date(project.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
            <span className="text-gray-300">|</span>
            <Link href={`/proyectos/${project.id}/informe`} className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              <BarChart3 className="w-4 h-4" /> Ver Informe Financiero
            </Link>
          </p>
          <DeleteProjectButton projectId={project.id} projectTitle={project.title} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Principal (editable) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <EditProjectForm project={{
              id: project.id,
              title: project.title,
              idea: project.idea,
              need: project.need,
              objectives: project.objectives,
              budget: project.budget,
            }} />
          </div>

          {/* Tareas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 mb-6">
              <ListTodo className="w-5 h-5 text-indigo-500" />
              Tareas del Proyecto
              {totalActions > 0 && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  {completedActions}/{totalActions} completadas
                </span>
              )}
            </h2>

            <AddActionForm
              projectId={project.id}
              participants={project.participants.map((p: { id: string; name: string; role: string }) => ({ id: p.id, name: p.name, role: p.role }))}
            />

            <div className="mt-6">
              {project.actions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No hay tareas pendientes ni completadas.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {project.actions.map((action: { id: string; title: string; description: string | null; date: Date | null; completed: boolean; participant: { name: string } | null }) => (
                    <li key={action.id} className="py-3 flex sm:items-center gap-4 group flex-col sm:flex-row">
                      <div className="flex-1 flex gap-3 items-start">
                        <form action={async () => {
                          "use server";
                          await toggleAction(project.id, action.id, !action.completed);
                        }} className="mt-0.5">
                          <button type="submit" className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${action.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-500'}`}>
                            {action.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        </form>
                        <div className={action.completed ? 'opacity-60 line-through' : ''}>
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{action.title}</p>
                          {action.date && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              Límite: {format(new Date(action.date), "dd MMM yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pl-8 sm:pl-0 sm:justify-end">
                        {action.participant ? (
                          <div className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded truncate max-w-[150px]" title={action.participant.name}>
                            👤 {action.participant.name}
                          </div>
                        ) : (
                          <div className="text-xs text-orange-600 bg-orange-50 px-2.5 py-1 rounded border border-orange-100">
                            Sin asignar
                          </div>
                        )}
                        <InlineDeleteButton
                          onConfirm={async () => {
                            "use server";
                            await removeAction(project.id, action.id);
                          }}
                          itemName="esta tarea"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Participantes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 mb-6">
              <Users className="w-5 h-5 text-indigo-500" />
              Participantes y Contactos
            </h2>
            <AddParticipantForm projectId={project.id} />
            <div className="mt-6">
              {project.participants.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No hay participantes registrados.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {project.participants.map((p: { id: string; name: string; role: string; email: string | null; phone: string | null }) => (
                    <li key={p.id} className="py-3 flex justify-between items-center group">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">{p.role.replace("_", " ")}</span>
                          {p.email && <span>{p.email}</span>}
                          {p.phone && <span>{p.phone}</span>}
                        </p>
                      </div>
                      <InlineDeleteButton
                        onConfirm={async () => {
                          "use server";
                          await removeParticipant(project.id, p.id);
                        }}
                        itemName="participante"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Gastos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                Control de Gastos
              </h2>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase">Total Gastado</p>
                <p className="text-xl font-bold text-indigo-700">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
            <AddExpenseForm projectId={project.id} />
            <div className="mt-6">
              {project.expenses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">Aún no se han registrado gastos en este proyecto.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {project.expenses.map((exp: { id: string; concept: string; amount: number; date: Date; invoiceNum: string | null; category: string }) => {
                    const catInfo = getExpenseCategoryInfo(exp.category);
                    return (
                      <li key={exp.id} className="py-3 flex justify-between items-center group">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{exp.concept}</p>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${catInfo.style}`}>{catInfo.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{format(new Date(exp.date), "dd MMM yyyy", { locale: es })}</span>
                            {exp.invoiceNum && <span className="bg-gray-100 px-2 py-0.5 rounded">Fact: {exp.invoiceNum}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-900">{formatCurrency(exp.amount)}</span>
                          <InlineDeleteButton
                            onConfirm={async () => {
                              "use server";
                              await removeExpense(project.id, exp.id);
                            }}
                            itemName="gasto"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Ingresos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Ingresos y Aportaciones
              </h2>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase">Total Ingresos</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalIncomes)}</p>
              </div>
            </div>
            <AddIncomeForm projectId={project.id} />
            <div className="mt-6">
              {project.incomes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">Sin ingresos o aportaciones registradas.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {project.incomes.map((inc: { id: string; concept: string; amount: number; date: Date; type: string; contributor: string | null }) => {
                    const typeInfo = getIncomeTypeInfo(inc.type);
                    return (
                      <li key={inc.id} className="py-3 flex justify-between items-center group">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{inc.concept}</p>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeInfo.style}`}>{typeInfo.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{format(new Date(inc.date), "dd MMM yyyy", { locale: es })}</span>
                            {inc.contributor && <span className="font-medium">· {inc.contributor}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-emerald-700">+{formatCurrency(inc.amount)}</span>
                          <InlineDeleteButton
                            onConfirm={async () => {
                              "use server";
                              await removeIncome(project.id, inc.id);
                            }}
                            itemName="ingreso"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 mb-6">
              <FileText className="w-5 h-5 text-indigo-500" />
              Documentación y Enlaces
            </h2>
            <AddDocumentForm projectId={project.id} />
            <div className="mt-6">
              {project.documents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No hay documentos ni enlaces adjuntos.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {project.documents.map((doc: { id: string; name: string; url: string; uploadDate: Date }) => (
                    <li key={doc.id} className="py-3 flex justify-between items-center group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate pr-4">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-2 truncate">
                            {doc.name}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Subido el {format(new Date(doc.uploadDate), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <InlineDeleteButton
                        onConfirm={async () => {
                          "use server";
                          await removeDocument(project.id, doc.id);
                        }}
                        itemName="documento"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Balance Financiero */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Balance del Proyecto</h2>

            {/* Budget progress bar */}
            {project.budget != null && project.budget > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Presupuesto</span>
                  <span className="font-semibold">{formatCurrency(project.budget)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${totalExpenses > project.budget ? 'bg-red-500' : totalExpenses > project.budget * 0.8 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min((totalExpenses / project.budget) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-right">
                  {((totalExpenses / project.budget) * 100).toFixed(0)}% consumido
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Ingresos:</span>
              <span className="font-bold text-emerald-700 text-right">+{formatCurrency(totalIncomes)}</span>
              <span className="text-gray-500">Gastos:</span>
              <span className="font-bold text-red-600 text-right">-{formatCurrency(totalExpenses)}</span>
            </div>
            <div className={`flex justify-between items-center pt-3 border-t font-bold text-base ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              <span>Balance</span>
              <span>{balance >= 0 ? '+' : ''}{formatCurrency(balance)}</span>
            </div>
          </div>

          {/* Cronograma */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <CalendarMonth className="w-5 h-5 text-indigo-500" />
                Cronograma
              </h2>
              <Link
                href={`/proyectos/${project.id}/fechas`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Editar
              </Link>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Convocatoria</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Publicación:</span>
                  <span className="font-medium text-gray-900 text-right">{project.callDate ? format(new Date(project.callDate), "dd/MM/yyyy") : "-"}</span>
                  <span className="text-gray-500">Presentación:</span>
                  <span className="font-medium text-gray-900 text-right">{project.presentationDate ? format(new Date(project.presentationDate), "dd/MM/yyyy") : "-"}</span>
                  <span className="text-gray-500">Resolución:</span>
                  <span className="font-medium text-gray-900 text-right">{project.resolutionDate ? format(new Date(project.resolutionDate), "dd/MM/yyyy") : "-"}</span>
                </div>
              </div>
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ejecución</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Inicio:</span>
                  <span className="font-medium text-gray-900 text-right">{project.startDate ? format(new Date(project.startDate), "dd/MM/yyyy") : "-"}</span>
                  <span className="text-gray-500">Fin:</span>
                  <span className="font-medium text-gray-900 text-right">{project.endDate ? format(new Date(project.endDate), "dd/MM/yyyy") : "-"}</span>
                </div>
              </div>
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cierre</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Publicidad:</span>
                  <span className="font-medium text-gray-900 text-right">{project.publicityDate ? format(new Date(project.publicityDate), "dd/MM/yyyy") : "-"}</span>
                  <span className="text-gray-500 border-l-2 pl-2 border-red-400 font-bold block">Justificación:</span>
                  <span className="font-bold text-red-600 text-right">{project.justificationDate ? format(new Date(project.justificationDate), "dd/MM/yyyy") : "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
