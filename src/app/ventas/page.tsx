import { prisma } from '@/lib/prisma'
import VentasClient from './VentasClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Ventas - MerchApp',
}

export default async function VentasPage() {
  const ventas = await prisma.venta.findMany({
    include: {
      contact: true,
      detalles: {
        include: {
          producto: true
        }
      },
      movimientos: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { fecha: 'desc' }
  })

  return <VentasClient ventas={ventas} />
}
