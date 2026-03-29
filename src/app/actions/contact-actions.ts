'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ActionResult, actionSuccess, actionError } from '@/lib/actions'

export async function createContact(formData: FormData): Promise<ActionResult> {
  try {
    const name = formData.get('nombre') as string
    if (!name) return actionError('El nombre es obligatorio')

    const data = {
      name,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('telefono') as string) || null,
      notes: (formData.get('direccion') as string) || null, // re-using direccion as notes
      type: 'PERSONA'
    }

    const contact = await prisma.contact.create({ data })
    revalidatePath('/contactos')
    return actionSuccess('Contacto registrado con éxito', contact)
  } catch (error) {
    console.error('Error creating contact:', error)
    return actionError('Ocurrió un error al registrar el contacto')
  }
}

export async function editContact(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const name = formData.get('nombre') as string
    if (!name) return actionError('El nombre es obligatorio')

    const data = {
      name,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('telefono') as string) || null,
      notes: (formData.get('direccion') as string) || null,
    }

    const contact = await prisma.contact.update({
      where: { id },
      data
    })
    
    revalidatePath('/contactos')
    revalidatePath(`/contactos/${id}`)
    return actionSuccess('Contacto actualizado con éxito', contact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return actionError('Ocurrió un error al actualizar el contacto')
  }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    const count = await prisma.venta.count({ where: { contactId: id } })
    if (count > 0) {
      return actionError('No se puede eliminar un contacto con ventas registradas. Elimine sus ventas primero.')
    }

    await prisma.contact.delete({ where: { id } })
    revalidatePath('/contactos')
    return actionSuccess('Contacto eliminado con éxito')
  } catch (error) {
    console.error('Error deleting contact:', error)
    return actionError('Ocurrió un error al eliminar el contacto')
  }
}
