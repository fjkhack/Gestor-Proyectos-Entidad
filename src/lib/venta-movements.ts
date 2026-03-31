import { Prisma } from '@prisma/client'

export type VentaMovimientoTipo =
  | 'VENTA_CREADA'
  | 'ABONO'
  | 'PAGO_COMPLETO'
  | 'DEVOLUCION_PARCIAL'
  | 'DEVOLUCION_TOTAL'
  | 'VENTA_ELIMINADA'

type CreateVentaMovimientoInput = {
  tx: Prisma.TransactionClient
  ventaId: string
  tipo: VentaMovimientoTipo
  resumen: string
  monto?: number | null
  total: number
  montoPagado: number
  meta?: unknown
}

export async function createVentaMovimiento(input: CreateVentaMovimientoInput) {
  const deuda = Math.max(input.total - input.montoPagado, 0)

  const tx = input.tx as Prisma.TransactionClient & {
    ventaMovimiento: {
      create: (args: {
        data: {
          ventaId: string
          tipo: VentaMovimientoTipo
          resumen: string
          monto: number | null
          total: number
          montoPagado: number
          deuda: number
          meta: string | null
        }
      }) => Promise<unknown>
    }
  }

  await tx.ventaMovimiento.create({
    data: {
      ventaId: input.ventaId,
      tipo: input.tipo,
      resumen: input.resumen,
      monto: input.monto ?? null,
      total: input.total,
      montoPagado: input.montoPagado,
      deuda,
      meta: input.meta ? JSON.stringify(input.meta) : null,
    },
  })
}
