"use client";

import { createProject } from "@/app/actions/project-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoProyectoPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/proyectos" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Proyecto</h1>
          <p className="text-gray-500">Registra una nueva idea o necesidad para tu entidad</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <form action={createProject} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título del Proyecto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ej: Talleres de Verano 2026"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="idea" className="block text-sm font-medium text-gray-700">
              Idea Original (Resumen)
            </label>
            <textarea
              name="idea"
              id="idea"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="¿De qué trata este proyecto de forma resumida?"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="need" className="block text-sm font-medium text-gray-700">
              Necesidad que cubre
            </label>
            <textarea
              name="need"
              id="need"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="¿Por qué es necesario hacer esto? ¿A quién ayuda?"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="objectives" className="block text-sm font-medium text-gray-700">
              Objetivos Principales
            </label>
            <textarea
              name="objectives"
              id="objectives"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="¿Qué metas medibles esperamos alcanzar?"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
              Presupuesto Estimado (€)
            </label>
            <input
              type="number"
              name="budget"
              id="budget"
              step="0.01"
              min="0"
              className="w-full sm:w-48 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          <div className="pt-4 border-t flex justify-end gap-4">
            <Link
              href="/proyectos"
              className="px-6 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              Guardar Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
