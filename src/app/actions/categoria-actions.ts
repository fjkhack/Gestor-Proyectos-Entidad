'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ActionResult, actionSuccess, actionError } from '@/lib/actions'

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export async function createCategoria(formData: FormData): Promise<ActionResult> {
  try {
    const nombre = formData.get('nombre') as string
    if (!nombre) return actionError('El nombre de la categoría es obligatorio')

    const categoria = await prisma.categoria.create({ 
      data: { nombre } 
    })
    
    revalidatePath('/categorias')
    revalidatePath('/productos')
    return actionSuccess('Categoría creada con éxito', categoria)
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return actionError('Ya existe una categoría con este nombre')
    }
    console.error('Error creating categoria:', error)
    return actionError('Ocurrió un error al crear la categoría')
  }
}

export async function editCategoria(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const nombre = formData.get('nombre') as string
    if (!nombre) return actionError('El nombre de la categoría es obligatorio')

    const categoria = await prisma.categoria.update({
      where: { id },
      data: { nombre }
    })
    
    revalidatePath('/categorias')
    revalidatePath('/productos')
    return actionSuccess('Categoría actualizada con éxito', categoria)
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      return actionError('Ya existe una categoría con este nombre')
    }
    console.error('Error updating categoria:', error)
    return actionError('Ocurrió un error al actualizar la categoría')
  }
}

export async function deleteCategoria(id: string): Promise<ActionResult> {
  try {
    const count = await prisma.producto.count({ where: { categoriaId: id } })
    if (count > 0) {
      return actionError('No se puede eliminar una categoría que tiene productos asociados.')
    }

    await prisma.categoria.delete({ where: { id } })
    revalidatePath('/categorias')
    revalidatePath('/productos')
    return actionSuccess('Categoría eliminada con éxito')
  } catch (error) {
    console.error('Error deleting categoria:', error)
    return actionError('Ocurrió un error al eliminar la categoría')
  }
}
