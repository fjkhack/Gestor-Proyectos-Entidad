import { prisma } from '@/lib/prisma'
import ComprasClient from './ComprasClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Compras',
}

export default async function ComprasPage() {
  const compras = await prisma.compra.findMany({
    include: {
      contact: true,
      detalles: {
        include: {
          producto: true
        }
      }
    },
    orderBy: { fecha: 'desc' }
  })

  return <ComprasClient compras={compras} />
}
