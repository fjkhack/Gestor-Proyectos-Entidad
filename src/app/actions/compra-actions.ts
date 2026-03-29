'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ActionResult, actionSuccess, actionError } from '@/lib/actions'

export type CompraDetalleInput = {
  productoId: string
  cantidad: number
  precioUnitario: number
}

export async function createCompra(contactId: string, notas: string | null, detalles: CompraDetalleInput[]): Promise<ActionResult> {
  try {
    if (!contactId) return actionError('El nombre del proveedor es obligatorio')
    if (!detalles || detalles.length === 0) return actionError('Debe agregar al menos un producto a la compra')

    for (const det of detalles) {
      if (!det.productoId) return actionError('Cada línea debe tener un producto válido')
      if (!Number.isInteger(det.cantidad) || det.cantidad <= 0) {
        return actionError('La cantidad de cada línea debe ser un entero mayor que 0')
      }
      if (!Number.isFinite(det.precioUnitario) || det.precioUnitario < 0) {
        return actionError('El precio unitario de cada línea debe ser mayor o igual que 0')
      }

      const producto = await prisma.producto.findUnique({ where: { id: det.productoId } })
      if (!producto) return actionError(`El producto ID ${det.productoId} no existe`)
    }

    // Calculate total
    const total = detalles.reduce((acc, det) => acc + (det.cantidad * det.precioUnitario), 0)

    // Execute in a transaction to ensure stock update and purchase creation are atomic
    const compra = await prisma.$transaction(async (tx) => {
      // 1. Create Compra and DetalleCompra
      const nuevaCompra = await tx.compra.create({
        data: {
          contactId,
          notas,
          total,
          detalles: {
            create: detalles.map(d => ({
              productoId: d.productoId,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario
            }))
          }
        }
      })

      // 2. Update stock for each product
      for (const det of detalles) {
        await tx.producto.update({
          where: { id: det.productoId },
          data: {
            stockActual: {
              increment: det.cantidad
            }
          }
        })
      }

      return nuevaCompra
    })

    revalidatePath('/compras')
    revalidatePath('/productos')
    return actionSuccess('Compra registrada y stock actualizado con éxito', compra)
  } catch (error) {
    console.error('Error creating compra:', error)
    return actionError('Ocurrió un error al registrar la compra')
  }
}

export async function deleteCompra(id: string): Promise<ActionResult> {
  try {
    // Transaction to safely delete and decrement stock
    await prisma.$transaction(async (tx) => {
      const compra = await tx.compra.findUnique({
        where: { id },
        include: { detalles: true }
      })

      if (!compra) throw new Error('Compra no encontrada')

      // Decrement stock for each removed item
      for (const det of compra.detalles) {
        const producto = await tx.producto.findUnique({ where: { id: det.productoId } })
        if (!producto) throw new Error(`Producto no encontrado: ${det.productoId}`)
        if (producto.stockActual < det.cantidad) {
          throw new Error(`No se puede eliminar la compra: stock insuficiente para revertir ${producto.nombre}`)
        }

        await tx.producto.update({
          where: { id: det.productoId },
          data: {
            stockActual: {
              decrement: det.cantidad
            }
          }
        })
      }

      await tx.compra.delete({ where: { id } })
    })

    revalidatePath('/compras')
    revalidatePath('/productos')
    return actionSuccess('Compra eliminada y stock revertido con éxito')
  } catch (error) {
    console.error('Error deleting compra:', error)
    return actionError('Ocurrió un error al eliminar la compra')
  }
}
