'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ActionResult, actionSuccess, actionError } from '@/lib/actions'

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export type VentaDetalleInput = {
  productoId: string
  cantidad: number
  precioUnitario: number
}

export async function createVenta(
  contactId: string,
  notas: string | null,
  estadoPago: string,
  detalles: VentaDetalleInput[],
  projectId?: string | null
): Promise<ActionResult> {
  try {
    if (!contactId) return actionError('Debe seleccionar un cliente')
    if (!detalles || detalles.length === 0) return actionError('Debe agregar al menos un producto a la venta')

    for (const det of detalles) {
      if (!det.productoId) return actionError('Cada línea debe tener un producto válido')
      if (!Number.isInteger(det.cantidad) || det.cantidad <= 0) {
        return actionError('La cantidad de cada línea debe ser un entero mayor que 0')
      }
      if (!Number.isFinite(det.precioUnitario) || det.precioUnitario < 0) {
        return actionError('El precio unitario de cada línea debe ser mayor o igual que 0')
      }
    }

    // Pre-validate stock
    for (const det of detalles) {
      const producto = await prisma.producto.findUnique({ where: { id: det.productoId } })
      if (!producto) return actionError(`El producto ID ${det.productoId} no existe`)
      if (producto.stockActual < det.cantidad) {
        return actionError(`Stock insuficiente para "${producto.nombre}". Stock: ${producto.stockActual}, Solicitado: ${det.cantidad}`)
      }
    }

    const total = detalles.reduce((acc, det) => acc + (det.cantidad * det.precioUnitario), 0)

    const venta = await prisma.$transaction(async (tx) => {
      // Obtener nombre del contacto para el ingreso
      const contact = await tx.contact.findUnique({ where: { id: contactId } })
      if (!contact) throw new Error('Contacto no encontrado')

      let incomeId: string | null = null

      if (projectId) {
        // Construir concepto con nombres de productos
        const productNames = await Promise.all(
          detalles.map(async (d) => {
            const p = await tx.producto.findUnique({ where: { id: d.productoId }, select: { nombre: true } })
            return p ? `${p.nombre} × ${d.cantidad}` : `Producto × ${d.cantidad}`
          })
        )
        const concept = `Venta: ${productNames.join(', ')}`

        // Crear el ingreso automático en el proyecto
        const income = await tx.income.create({
          data: {
            concept,
            amount: total,
            date: new Date(),
            type: 'VENTA',
            contributor: contact.name,
            projectId,
          },
        })
        incomeId = income.id
      }

      // Crear Venta y DetalleVenta
      const nuevaVenta = await tx.venta.create({
        data: {
          contactId,
          notas,
          total,
          estadoPago,
          montoPagado: estadoPago === 'PAGADO' ? total : 0,
          projectId: projectId || null,
          incomeId,
          detalles: {
            create: detalles.map(d => ({
              productoId: d.productoId,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
            })),
          },
        },
      })

      // Descontar stock
      for (const det of detalles) {
        const producto = await tx.producto.findUnique({ where: { id: det.productoId } })
        if (!producto || producto.stockActual < det.cantidad) {
          throw new Error(`Stock insuficiente para el producto ID ${det.productoId}`)
        }
        await tx.producto.update({
          where: { id: det.productoId },
          data: { stockActual: { decrement: det.cantidad } },
        })
      }

      return nuevaVenta
    })

    revalidatePath('/ventas')
    revalidatePath('/productos')
    revalidatePath(`/contactos/${contactId}`)
    if (projectId) {
      revalidatePath(`/proyectos/${projectId}`)
      revalidatePath('/ingresos')
    }
    return actionSuccess('Venta registrada con éxito', venta)
  } catch (error: unknown) {
    console.error('Error creating venta:', error)
    return actionError(getErrorMessage(error, 'Ocurrió un error al registrar la venta'))
  }
}

export async function deleteVenta(id: string): Promise<ActionResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: true },
      })

      if (!venta) throw new Error('Venta no encontrada')

      // Restaurar stock si no fue devuelta
      if (venta.estadoVenta !== 'DEVUELTA') {
        for (const det of venta.detalles) {
          await tx.producto.update({
            where: { id: det.productoId },
            data: { stockActual: { increment: det.cantidad } },
          })
        }
      }

      // Eliminar el ingreso automático asociado si existe
      if (venta.incomeId) {
        await tx.income.delete({ where: { id: venta.incomeId } }).catch(() => {})
      }

      await tx.venta.delete({ where: { id } })
    })

    revalidatePath('/ventas')
    revalidatePath('/productos')
    revalidatePath('/ingresos')
    return actionSuccess('Venta eliminada y stock restituido con éxito')
  } catch (error) {
    console.error('Error deleting venta:', error)
    return actionError('Ocurrió un error al eliminar la venta')
  }
}

export async function markVentaAsPaid(id: string): Promise<ActionResult> {
  try {
    const venta = await prisma.venta.findUnique({ where: { id } })
    if (!venta) return actionError('Venta no encontrada')

    await prisma.venta.update({
      where: { id },
      data: {
        estadoPago: 'PAGADO',
        montoPagado: venta.total,
      },
    })
    revalidatePath('/ventas')
    revalidatePath('/contactos')
    return actionSuccess('Venta marcada como pagada')
  } catch (error) {
    console.error('Error updating venta:', error)
    return actionError('Ocurrió un error al actualizar la venta')
  }
}

export async function returnVenta(id: string): Promise<ActionResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: true },
      })

      if (!venta) throw new Error('Venta no encontrada')
      if (venta.estadoVenta === 'DEVUELTA') throw new Error('La venta ya ha sido devuelta')

      // Restaurar stock
      for (const det of venta.detalles) {
        await tx.producto.update({
          where: { id: det.productoId },
          data: { stockActual: { increment: det.cantidad } },
        })
      }

      // Eliminar el ingreso automático si existe
      if (venta.incomeId) {
        await tx.income.delete({ where: { id: venta.incomeId } }).catch(() => {})
      }

      await tx.venta.update({
        where: { id },
        data: { estadoVenta: 'DEVUELTA', total: 0, incomeId: null },
      })
    })

    revalidatePath('/ventas')
    revalidatePath('/productos')
    revalidatePath('/contactos')
    revalidatePath('/ingresos')
    return actionSuccess('Venta devuelta y stock restaurado con éxito')
  } catch (error: unknown) {
    console.error('Error returning venta:', error)
    return actionError(getErrorMessage(error, 'Ocurrió un error al devolver la venta'))
  }
}

export async function payPartialVenta(id: string, importe: number): Promise<ActionResult> {
  try {
    if (importe <= 0) return actionError('El importe a abonar debe ser mayor que 0')
    if (!Number.isFinite(importe)) return actionError('El importe a abonar no es válido')

    const result = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({ where: { id } })
      if (!venta) throw new Error('Venta no encontrada')
      if (venta.estadoVenta === 'DEVUELTA') throw new Error('No se puede pagar una venta devuelta')
      if (venta.estadoPago === 'PAGADO') throw new Error('La venta ya está pagada')

      const restante = Math.max(venta.total - venta.montoPagado, 0)
      if (importe > restante) {
        throw new Error(`El abono supera lo pendiente (${restante.toFixed(2)} EUR)`) 
      }

      const nuevoMonto = venta.montoPagado + importe
      const estadoPago = nuevoMonto >= venta.total ? 'PAGADO' : 'PENDIENTE'

      await tx.venta.update({
        where: { id },
        data: { montoPagado: nuevoMonto, estadoPago },
      })

      return actionSuccess(
        `Abono de ${importe}€ registrado con éxito. ${estadoPago === 'PAGADO' ? 'Venta liquidada.' : ''}`
      )
    })

    revalidatePath('/ventas')
    revalidatePath('/contactos')
    return result
  } catch (error: unknown) {
    console.error('Error in payPartialVenta:', error)
    return actionError(getErrorMessage(error, 'Ocurrió un error al registrar el abono'))
  }
}
