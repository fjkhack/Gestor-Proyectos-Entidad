'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ActionResult, actionSuccess, actionError } from '@/lib/actions'
import { createVentaMovimiento } from '@/lib/venta-movements'
import { notifyVentaMovement } from '@/lib/venta-notifications'

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function sanitizeCopyEmail(email?: string | null): string | null {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null
  if (!/^\S+@\S+\.\S+$/.test(normalized)) return null
  return normalized
}

function money(value: number): string {
  return `${value.toFixed(2)} EUR`
}

function toLineItems(
  detalles: Array<{
    cantidad: number
    precioUnitario: number
    producto?: { nombre: string } | null
  }>
) {
  return detalles.map((det) => ({
    nombre: det.producto?.nombre || 'Producto eliminado',
    cantidad: det.cantidad,
    importe: det.cantidad * det.precioUnitario,
  }))
}

export type VentaDetalleInput = {
  productoId: string
  cantidad: number
  precioUnitario: number
}

export type ReturnVentaItemInput = {
  detalleId: string
  cantidad: number
}

export async function createVenta(
  contactId: string,
  notas: string | null,
  estadoPago: string,
  detalles: VentaDetalleInput[],
  projectId?: string | null,
  copyEmail?: string | null
): Promise<ActionResult> {
  try {
    const safeCopyEmail = sanitizeCopyEmail(copyEmail)
    if (copyEmail && !safeCopyEmail) return actionError('El email de copia no es válido')

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

    for (const det of detalles) {
      const producto = await prisma.producto.findUnique({ where: { id: det.productoId } })
      if (!producto) return actionError(`El producto ID ${det.productoId} no existe`)
      if (producto.stockActual < det.cantidad) {
        return actionError(`Stock insuficiente para "${producto.nombre}". Stock: ${producto.stockActual}, Solicitado: ${det.cantidad}`)
      }
    }

    const total = detalles.reduce((acc, det) => acc + det.cantidad * det.precioUnitario, 0)

    const result = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.findUnique({ where: { id: contactId } })
      if (!contact) throw new Error('Contacto no encontrado')

      let incomeId: string | null = null

      if (projectId) {
        const productNames = await Promise.all(
          detalles.map(async (d) => {
            const p = await tx.producto.findUnique({ where: { id: d.productoId }, select: { nombre: true } })
            return p ? `${p.nombre} × ${d.cantidad}` : `Producto × ${d.cantidad}`
          })
        )

        const income = await tx.income.create({
          data: {
            concept: `Venta: ${productNames.join(', ')}`,
            amount: total,
            date: new Date(),
            type: 'VENTA',
            contributor: contact.name,
            projectId,
          },
        })
        incomeId = income.id
      }

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
            create: detalles.map((d) => ({
              productoId: d.productoId,
              cantidad: d.cantidad,
              precioUnitario: d.precioUnitario,
            })),
          },
        },
      })

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

      await createVentaMovimiento({
        tx,
        ventaId: nuevaVenta.id,
        tipo: 'VENTA_CREADA',
        resumen: `Venta creada por ${money(total)} (${estadoPago === 'PAGADO' ? 'cobrada' : 'fiada'})`,
        monto: total,
        total: nuevaVenta.total,
        montoPagado: nuevaVenta.montoPagado,
        meta: {
          estadoPago,
          notas,
          detalles,
        },
      })

      return {
        venta: nuevaVenta,
        contactName: contact.name,
        contactEmail: contact.email,
      }
    })

    revalidatePath('/ventas')
    revalidatePath('/productos')
    revalidatePath(`/contactos/${contactId}`)
    if (projectId) {
      revalidatePath(`/proyectos/${projectId}`)
      revalidatePath('/ingresos')
    }

    await notifyVentaMovement({
      movementTitle: 'Venta creada',
      movementDescription: `Se ha registrado una venta por ${money(result.venta.total)}.`,
      ventaId: result.venta.id,
      contactName: result.contactName,
      contactEmail: result.contactEmail,
      copyEmail: safeCopyEmail,
      total: result.venta.total,
      montoPagado: result.venta.montoPagado,
      deuda: Math.max(result.venta.total - result.venta.montoPagado, 0),
      amountChanged: result.venta.total,
    }).catch((error) => {
      console.error('Error sending venta created email:', error)
    })

    return actionSuccess('Venta registrada con éxito', result.venta)
  } catch (error: unknown) {
    console.error('Error creating venta:', error)
    return actionError(getErrorMessage(error, 'Ocurrió un error al registrar la venta'))
  }
}

export async function deleteVenta(id: string, copyEmail?: string | null): Promise<ActionResult> {
  try {
    const safeCopyEmail = sanitizeCopyEmail(copyEmail)
    if (copyEmail && !safeCopyEmail) return actionError('El email de copia no es válido')

    const result = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: { include: { producto: true } }, contact: true },
      })

      if (!venta) throw new Error('Venta no encontrada')

      if (venta.estadoVenta !== 'DEVUELTA') {
        for (const det of venta.detalles) {
          await tx.producto.update({
            where: { id: det.productoId },
            data: { stockActual: { increment: det.cantidad } },
          })
        }
      }

      if (venta.incomeId) {
        await tx.income.delete({ where: { id: venta.incomeId } }).catch(() => {})
      }

      await tx.venta.delete({ where: { id } })

      return {
        contactName: venta.contact.name,
        contactEmail: venta.contact.email,
        total: venta.total,
        montoPagado: venta.montoPagado,
        lineItems: toLineItems(venta.detalles),
      }
    })

    revalidatePath('/ventas')
    revalidatePath('/productos')
    revalidatePath('/ingresos')

    await notifyVentaMovement({
      movementTitle: 'Venta eliminada',
      movementDescription: 'Se ha eliminado el registro de la venta.',
      ventaId: id,
      contactName: result.contactName,
      contactEmail: result.contactEmail,
      copyEmail: safeCopyEmail,
      total: 0,
      montoPagado: 0,
      deuda: 0,
      amountChanged: result.total,
      lineItems: result.lineItems,
    }).catch((error) => {
      console.error('Error sending venta delete email:', error)
    })

    return actionSuccess('Venta eliminada y stock restituido con éxito')
  } catch (error) {
    console.error('Error deleting venta:', error)
    return actionError('Ocurrió un error al eliminar la venta')
  }
}

export async function markVentaAsPaid(id: string, copyEmail?: string | null): Promise<ActionResult> {
  try {
    const safeCopyEmail = sanitizeCopyEmail(copyEmail)
    if (copyEmail && !safeCopyEmail) return actionError('El email de copia no es válido')

    const result = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: { include: { producto: true } }, contact: true },
      })
      if (!venta) throw new Error('Venta no encontrada')

      const pagoAdicional = Math.max(venta.total - venta.montoPagado, 0)

      const updated = await tx.venta.update({
        where: { id },
        data: {
          estadoPago: 'PAGADO',
          montoPagado: venta.total,
        },
      })

      await createVentaMovimiento({
        tx,
        ventaId: venta.id,
        tipo: 'PAGO_COMPLETO',
        resumen: `Venta liquidada completamente. Pago adicional: ${money(pagoAdicional)}`,
        monto: pagoAdicional,
        total: updated.total,
        montoPagado: updated.montoPagado,
        meta: {
          estadoPagoAnterior: venta.estadoPago,
          montoPagadoAnterior: venta.montoPagado,
        },
      })

      return {
        venta: updated,
        pagoAdicional,
        contactName: venta.contact.name,
        contactEmail: venta.contact.email,
        lineItems: toLineItems(venta.detalles),
      }
    })

    revalidatePath('/ventas')
    revalidatePath('/contactos')
    revalidatePath(`/contactos/${result.venta.contactId}`)

    await notifyVentaMovement({
      movementTitle: 'Pago completo',
      movementDescription: `La venta se ha marcado como pagada. Pago adicional aplicado: ${money(result.pagoAdicional)}.`,
      ventaId: result.venta.id,
      contactName: result.contactName,
      contactEmail: result.contactEmail,
      copyEmail: safeCopyEmail,
      total: result.venta.total,
      montoPagado: result.venta.montoPagado,
      deuda: Math.max(result.venta.total - result.venta.montoPagado, 0),
      amountChanged: result.pagoAdicional,
      lineItems: result.lineItems,
    }).catch((error) => {
      console.error('Error sending full payment email:', error)
    })

    return actionSuccess('Venta marcada como pagada')
  } catch (error) {
    console.error('Error updating venta:', error)
    return actionError('Ocurrió un error al actualizar la venta')
  }
}

export async function returnVenta(id: string, copyEmail?: string | null): Promise<ActionResult> {
  try {
    const safeCopyEmail = sanitizeCopyEmail(copyEmail)
    if (copyEmail && !safeCopyEmail) return actionError('El email de copia no es válido')

    const result = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: { include: { producto: true } }, contact: true },
      })

      if (!venta) throw new Error('Venta no encontrada')
      if (venta.estadoVenta === 'DEVUELTA') throw new Error('La venta ya ha sido devuelta')

      const importeADevolver = venta.montoPagado
      const returnedLines = venta.detalles.map((det) => ({
        producto: det.producto?.nombre || 'Producto eliminado',
        cantidad: det.cantidad,
        importe: det.cantidad * det.precioUnitario,
      }))

      for (const det of venta.detalles) {
        await tx.producto.update({
          where: { id: det.productoId },
          data: { stockActual: { increment: det.cantidad } },
        })
      }

      if (venta.incomeId) {
        await tx.income.delete({ where: { id: venta.incomeId } }).catch(() => {})
      }

      const updated = await tx.venta.update({
        where: { id },
        data: { estadoVenta: 'DEVUELTA', total: 0, montoPagado: 0, estadoPago: 'PAGADO', incomeId: null },
      })

      await createVentaMovimiento({
        tx,
        ventaId: venta.id,
        tipo: 'DEVOLUCION_TOTAL',
        resumen: `Devolución total procesada. Importe a devolver al cliente: ${money(importeADevolver)}`,
        monto: importeADevolver,
        total: updated.total,
        montoPagado: updated.montoPagado,
        meta: {
          estadoVentaAnterior: venta.estadoVenta,
          totalAnterior: venta.total,
          montoPagadoAnterior: venta.montoPagado,
        },
      })

      return {
        venta: updated,
        contactName: venta.contact.name,
        contactEmail: venta.contact.email,
        importeADevolver,
        returnedLines,
      }
    })

    revalidatePath('/ventas')
    revalidatePath('/productos')
    revalidatePath('/contactos')
    revalidatePath(`/contactos/${result.venta.contactId}`)
    revalidatePath('/ingresos')

    await notifyVentaMovement({
      movementTitle: 'Devolución total',
      movementDescription: `Se ha anulado por completo la venta. Debes devolver al cliente ${money(result.importeADevolver)}.`,
      actionRequired: result.importeADevolver > 0 ? `Devolver ${money(result.importeADevolver)} al cliente.` : undefined,
      ventaId: result.venta.id,
      contactName: result.contactName,
      contactEmail: result.contactEmail,
      copyEmail: safeCopyEmail,
      total: result.venta.total,
      montoPagado: result.venta.montoPagado,
      deuda: 0,
      refundAmount: result.importeADevolver,
      lineItems: result.returnedLines.map((line) => ({
        nombre: line.producto,
        cantidad: line.cantidad,
        importe: line.importe,
      })),
    }).catch((error) => {
      console.error('Error sending full return email:', error)
    })

    return actionSuccess(
      `Venta devuelta y stock restaurado con éxito.${result.importeADevolver > 0 ? ` Debes devolver ${money(result.importeADevolver)} al cliente.` : ''}`
    )
  } catch (error: unknown) {
    console.error('Error returning venta:', error)
    return actionError(getErrorMessage(error, 'Ocurrió un error al devolver la venta'))
  }
}

export async function returnVentaPartial(
  id: string,
  items: ReturnVentaItemInput[],
  copyEmail?: string | null
): Promise<ActionResult> {
  try {
    const safeCopyEmail = sanitizeCopyEmail(copyEmail)
    if (copyEmail && !safeCopyEmail) return actionError('El email de copia no es válido')

    if (!items || items.length === 0) {
      return actionError('Debe seleccionar al menos un producto para devolver')
    }

    const normalizedItems = items
      .map((item) => ({
        detalleId: item.detalleId,
        cantidad: Math.floor(item.cantidad),
      }))
      .filter((item) => item.detalleId && item.cantidad > 0)

    if (normalizedItems.length === 0) {
      return actionError('Las cantidades a devolver deben ser mayores que 0')
    }

    const result = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: { include: { producto: true } }, contact: true },
      })

      if (!venta) throw new Error('Venta no encontrada')
      if (venta.estadoVenta === 'DEVUELTA') throw new Error('La venta ya ha sido devuelta')

      const detallesMap = new Map(venta.detalles.map((det) => [det.id, det]))

      let refundAmount = 0
      const returnedLines: Array<{ producto: string; cantidad: number; importe: number }> = []

      for (const item of normalizedItems) {
        const detalle = detallesMap.get(item.detalleId)
        if (!detalle) throw new Error('Una de las líneas seleccionadas no existe')
        if (item.cantidad > detalle.cantidad) {
          throw new Error(`No puede devolver más de ${detalle.cantidad} unidades en una línea`)
        }

        const importe = item.cantidad * detalle.precioUnitario
        refundAmount += importe
        returnedLines.push({
          producto: detalle.producto?.nombre || 'Producto eliminado',
          cantidad: item.cantidad,
          importe,
        })
      }

      if (refundAmount <= 0) throw new Error('No hay importe que devolver')

      for (const item of normalizedItems) {
        const detalle = detallesMap.get(item.detalleId)
        if (!detalle) continue

        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stockActual: { increment: item.cantidad } },
        })

        if (item.cantidad === detalle.cantidad) {
          await tx.detalleVenta.delete({ where: { id: detalle.id } })
        } else {
          await tx.detalleVenta.update({
            where: { id: detalle.id },
            data: { cantidad: { decrement: item.cantidad } },
          })
        }
      }

      const nuevoTotal = Math.max(venta.total - refundAmount, 0)
      const nuevoMontoPagado = Math.min(venta.montoPagado, nuevoTotal)
      const estadoVenta = nuevoTotal === 0 ? 'DEVUELTA' : 'PARCIALMENTE_DEVUELTA'
      const estadoPago = nuevoTotal === 0 || nuevoMontoPagado >= nuevoTotal ? 'PAGADO' : 'PENDIENTE'

      const updated = await tx.venta.update({
        where: { id: venta.id },
        data: {
          total: nuevoTotal,
          montoPagado: nuevoMontoPagado,
          estadoVenta,
          estadoPago,
        },
      })

      if (venta.incomeId) {
        if (nuevoTotal <= 0) {
          await tx.income.delete({ where: { id: venta.incomeId } }).catch(() => {})
          await tx.venta.update({ where: { id: venta.id }, data: { incomeId: null } })
        } else {
          await tx.income
            .update({
              where: { id: venta.incomeId },
              data: { amount: nuevoTotal },
            })
            .catch(() => {})
        }
      }

      await createVentaMovimiento({
        tx,
        ventaId: venta.id,
        tipo: 'DEVOLUCION_PARCIAL',
        resumen: `Devolución parcial por ${money(refundAmount)} (${returnedLines.length} línea(s)).`,
        monto: refundAmount,
        total: updated.total,
        montoPagado: updated.montoPagado,
        meta: {
          returnedLines,
        },
      })

      return {
        venta: updated,
        refundAmount,
        returnedLines,
        contactName: venta.contact.name,
        contactEmail: venta.contact.email,
      }
    })

    revalidatePath('/ventas')
    revalidatePath('/productos')
    revalidatePath('/contactos')
    revalidatePath(`/contactos/${result.venta.contactId}`)
    revalidatePath('/ingresos')

    await notifyVentaMovement({
      movementTitle: 'Devolución parcial',
      movementDescription: `Se ha registrado una devolución parcial por ${money(result.refundAmount)}.`,
      ventaId: result.venta.id,
      contactName: result.contactName,
      contactEmail: result.contactEmail,
      copyEmail: safeCopyEmail,
      total: result.venta.total,
      montoPagado: result.venta.montoPagado,
      deuda: Math.max(result.venta.total - result.venta.montoPagado, 0),
      refundAmount: result.refundAmount,
      lineItems: result.returnedLines.map((line) => ({
        nombre: line.producto,
        cantidad: line.cantidad,
        importe: line.importe,
      })),
    }).catch((error) => {
      console.error('Error sending partial return email:', error)
    })

    return actionSuccess(
      `Devolución parcial registrada. Importe devuelto: ${money(result.refundAmount)}. Nuevo total: ${money(result.venta.total)}.`
    )
  } catch (error: unknown) {
    console.error('Error returning venta partially:', error)
    return actionError(getErrorMessage(error, 'Ocurrió un error al procesar la devolución parcial'))
  }
}

export async function payPartialVenta(id: string, importe: number, copyEmail?: string | null): Promise<ActionResult> {
  try {
    const safeCopyEmail = sanitizeCopyEmail(copyEmail)
    if (copyEmail && !safeCopyEmail) return actionError('El email de copia no es válido')

    if (importe <= 0) return actionError('El importe a abonar debe ser mayor que 0')
    if (!Number.isFinite(importe)) return actionError('El importe a abonar no es válido')

    const result = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: { include: { producto: true } }, contact: true },
      })
      if (!venta) throw new Error('Venta no encontrada')
      if (venta.estadoVenta === 'DEVUELTA') throw new Error('No se puede pagar una venta devuelta')
      if (venta.estadoPago === 'PAGADO') throw new Error('La venta ya está pagada')

      const restante = Math.max(venta.total - venta.montoPagado, 0)
      if (importe > restante) {
        throw new Error(`El abono supera lo pendiente (${restante.toFixed(2)} EUR)`)
      }

      const nuevoMonto = venta.montoPagado + importe
      const estadoPago = nuevoMonto >= venta.total ? 'PAGADO' : 'PENDIENTE'

      const updated = await tx.venta.update({
        where: { id },
        data: { montoPagado: nuevoMonto, estadoPago },
      })

      await createVentaMovimiento({
        tx,
        ventaId: venta.id,
        tipo: 'ABONO',
        resumen: `Abono a cuenta por ${money(importe)}.`,
        monto: importe,
        total: updated.total,
        montoPagado: updated.montoPagado,
        meta: {
          estadoPago,
          pendienteAnterior: restante,
          pendienteActual: Math.max(updated.total - updated.montoPagado, 0),
        },
      })

      return {
        venta: updated,
        contactName: venta.contact.name,
        contactEmail: venta.contact.email,
        importe,
        lineItems: toLineItems(venta.detalles),
      }
    })

    revalidatePath('/ventas')
    revalidatePath('/contactos')
    revalidatePath(`/contactos/${result.venta.contactId}`)

    await notifyVentaMovement({
      movementTitle: 'Abono a cuenta',
      movementDescription: `Se ha registrado un abono de ${money(result.importe)}.`,
      ventaId: result.venta.id,
      contactName: result.contactName,
      contactEmail: result.contactEmail,
      copyEmail: safeCopyEmail,
      total: result.venta.total,
      montoPagado: result.venta.montoPagado,
      deuda: Math.max(result.venta.total - result.venta.montoPagado, 0),
      amountChanged: result.importe,
      lineItems: result.lineItems,
    }).catch((error) => {
      console.error('Error sending partial payment email:', error)
    })

    return actionSuccess(
      `Abono de ${money(result.importe)} registrado con éxito.${result.venta.estadoPago === 'PAGADO' ? ' Venta liquidada.' : ''}`
    )
  } catch (error: unknown) {
    console.error('Error in payPartialVenta:', error)
    return actionError(getErrorMessage(error, 'Ocurrió un error al registrar el abono'))
  }
}
