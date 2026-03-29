import { prisma } from '@/lib/prisma'
import CategoriasClient from './CategoriasClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Categorías - MerchApp',
}

export default async function CategoriasPage() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      _count: {
        select: { productos: true }
      }
    }
  })

  return <CategoriasClient categorias={categorias} />
}
