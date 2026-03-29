import VentaForm from '@/components/forms/VentaForm'
import { prisma } from '@/lib/prisma'
import { ShoppingBag } from 'lucide-react'

export const metadata = {
  title: 'Nueva Venta',
}

export default async function NuevaVentaPage() {
  const [productos, contacts, projects] = await Promise.all([
    prisma.producto.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.contact.findMany({ orderBy: { name: 'asc' } }),
    prisma.project.findMany({
      where: { status: { not: 'CANCELADO' } },
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 p-2.5 rounded-xl">
          <ShoppingBag className="w-6 h-6 text-indigo-700" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Registrar Nueva Venta</h1>
      </div>
      <VentaForm productos={productos} contacts={contacts} projects={projects} />
    </div>
  )
}
