import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProjectsTable } from "@/components/ProjectsTable";

export default async function ProyectosPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates to strings for client component
  const serialized = projects.map(p => ({
    id: p.id,
    title: p.title,
    idea: p.idea,
    status: p.status,
    budget: p.budget,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-gray-500 mt-1">Gestiona todos los proyectos de la entidad</p>
        </div>
        <Link
          href="/proyectos/nuevo"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
        </Link>
      </div>

      <ProjectsTable projects={serialized} />
    </div>
  );
}
