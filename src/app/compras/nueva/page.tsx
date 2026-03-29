import CompraForm from '@/components/forms/CompraForm'
import { prisma } from '@/lib/prisma'
import { ShoppingCart } from 'lucide-react'

export const metadata = {
  title: 'Nueva Compra',
}

export default async function NuevaCompraPage() {
  const productos = await prisma.producto.findMany({
    orderBy: { nombre: 'asc' }
  })
  
  const contacts = await prisma.contact.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 p-2.5 rounded-xl">
          <ShoppingCart className="w-6 h-6 text-indigo-700" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Registrar Nueva Compra</h1>
      </div>
      <CompraForm productos={productos} contacts={contacts} />
    </div>
  )
}
