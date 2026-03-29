import { updateProjectDates } from "@/app/actions/project-actions";
import Link from "next/link";
import { ArrowLeft, Save, Calendar as CalendarIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";

const formatDateForInput = (date: Date | null) => {
  if (!date) return "";
  return date.toISOString().split('T')[0];
};

export default async function EditarFechasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return null;
  }

  // Bind the project ID to the server action
  const updateDatesWithId = updateProjectDates.bind(null, id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/proyectos/${id}`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurar Cronograma</h1>
          <p className="text-gray-500">Establece las fechas clave para este proyecto</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <form action={updateDatesWithId} className="space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-700 border-b pb-2">
              <CalendarIcon className="w-5 h-5" /> Fase de Convocatoria
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="callDate" className="block text-sm font-medium text-gray-700">Fecha Convocatoria</label>
                <input defaultValue={formatDateForInput(project.callDate)} type="date" name="callDate" id="callDate" className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label htmlFor="presentationDate" className="block text-sm font-medium text-gray-700">Fecha Presentación límite</label>
                <input defaultValue={formatDateForInput(project.presentationDate)} type="date" name="presentationDate" id="presentationDate" className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label htmlFor="resolutionDate" className="block text-sm font-medium text-gray-700">Fecha Resolución esperada</label>
                <input defaultValue={formatDateForInput(project.resolutionDate)} type="date" name="resolutionDate" id="resolutionDate" className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-green-700 border-b pb-2">
              <CalendarIcon className="w-5 h-5" /> Fase de Ejecución
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Inicio del Proyecto</label>
                <input defaultValue={formatDateForInput(project.startDate)} type="date" name="startDate" id="startDate" className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fin del Proyecto</label>
                <input defaultValue={formatDateForInput(project.endDate)} type="date" name="endDate" id="endDate" className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-orange-700 border-b pb-2">
              <CalendarIcon className="w-5 h-5" /> Fase de Cierre
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="publicityDate" className="block text-sm font-medium text-gray-700">Fecha Difusión/Publicidad</label>
                <input defaultValue={formatDateForInput(project.publicityDate)} type="date" name="publicityDate" id="publicityDate" className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label htmlFor="justificationDate" className="block text-sm font-medium text-gray-700">Fecha Límite Justificación</label>
                <input defaultValue={formatDateForInput(project.justificationDate)} type="date" name="justificationDate" id="justificationDate" className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end gap-4 mt-8">
            <Link 
              href={`/proyectos/${id}`}
              className="px-6 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              Guardar Fechas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
