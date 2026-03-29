import { prisma } from '@/lib/prisma'
import ProductosClient from './ProductosClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Catálogo de Productos - MerchApp',
}

export default async function ProductosPage() {
  const [productos, categorias] = await Promise.all([
    prisma.producto.findMany({
      orderBy: { nombre: 'asc' },
      include: { categoria: true }
    }),
    prisma.categoria.findMany({
      orderBy: { nombre: 'asc' }
    })
  ])

  return <ProductosClient productos={productos} categorias={categorias} />
}
