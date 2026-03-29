'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { ActionResult, actionSuccess, actionError } from '@/lib/actions'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

async function saveImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  try {
    await mkdir(uploadDir, { recursive: true })
  } catch {}

  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
  const filePath = path.join(uploadDir, fileName)
  
  await writeFile(filePath, buffer)
  return `/uploads/${fileName}`
}
export async function createProducto(formData: FormData): Promise<ActionResult> {
  try {
    const nombre = formData.get('nombre') as string
    const categoriaIdInput = formData.get('categoriaId') as string
    const precioVentaInput = formData.get('precioVenta') as string
    const precioCompraInput = (formData.get('precioCompra') as string) || '0'
    
    if (!nombre || !categoriaIdInput || !precioVentaInput) {
      return actionError('Nombre, categoría y precio son obligatorios')
    }

    const categoriaId = categoriaIdInput

    const precioVenta = parseFloat(precioVentaInput)
    const precioCompra = parseFloat(precioCompraInput)
    if (isNaN(precioVenta) || precioVenta < 0 || isNaN(precioCompra) || precioCompra < 0) {
      return actionError('El precio debe ser un número válido')
    }

    // stockActual is 0 by default, changes only through compras/ventas. User can optionally set a starting stock
    const stockInput = formData.get('stockActual') as string
    const stockActual = stockInput ? parseInt(stockInput) : 0

    const existingImagen = formData.get('existingImagen') as string | null

    // Intentar leer el archivo si se subió uno
    let imagePath = existingImagen || null
    const file = formData.get('imagenArchivo') as File | null
    if (file && file.size > 0) {
      imagePath = await saveImage(file)
    }

    const data = {
      nombre,
      categoriaId,
      precioVenta,
      precioCompra,
      stockActual,
      imagen: imagePath,
    }

    const producto = await prisma.producto.create({ data })
    revalidatePath('/productos')
    return actionSuccess('Producto creado con éxito', producto)
  } catch (error) {
    console.error('Error creating producto:', error)
    return actionError('Ocurrió un error al crear el producto')
  }
}

export async function editProducto(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const nombre = formData.get('nombre') as string
    const categoriaIdInput = formData.get('categoriaId') as string
    const precioVentaInput = formData.get('precioVenta') as string
    const precioCompraInput = (formData.get('precioCompra') as string) || '0'
    
    if (!nombre || !categoriaIdInput || !precioVentaInput) {
      return actionError('Nombre, categoría y precio son obligatorios')
    }

    const categoriaId = categoriaIdInput

    const precioVenta = parseFloat(precioVentaInput)
    const precioCompra = parseFloat(precioCompraInput)
    if (isNaN(precioVenta) || precioVenta < 0 || isNaN(precioCompra) || precioCompra < 0) {
      return actionError('El precio debe ser un número válido')
    }

    // Optional stock modification
    const stockInput = formData.get('stockActual') as string
    const stockActual = stockInput ? parseInt(stockInput, 10) : undefined

    // Intentar leer el archivo si se subió uno
    let imagePath = undefined // undefined to not overwrite if no new file
    const file = formData.get('imagenArchivo') as File | null
    if (file && file.size > 0) {
      imagePath = await saveImage(file)
    }

    const data: {
      nombre: string
      categoriaId: string
      precioVenta: number
      precioCompra: number
      stockActual?: number
      imagen?: string | null
    } = {
      nombre,
      categoriaId,
      precioVenta,
      precioCompra,
    }
    
    if (stockActual !== undefined && !isNaN(stockActual) && stockActual >= 0) {
      data.stockActual = stockActual
    }

    if (imagePath !== undefined) {
      data.imagen = imagePath
    }

    const producto = await prisma.producto.update({
      where: { id },
      data
    })
    
    revalidatePath('/productos')
    return actionSuccess('Producto actualizado con éxito', producto)
  } catch (error) {
    console.error('Error updating producto:', error)
    return actionError('Ocurrió un error al actualizar el producto')
  }
}

export async function deleteProducto(id: string): Promise<ActionResult> {
  try {
    const countVentas = await prisma.detalleVenta.count({ where: { productoId: id } })
    const countCompras = await prisma.detalleCompra.count({ where: { productoId: id } })
    
    if (countVentas > 0 || countCompras > 0) {
      return actionError('No se puede eliminar un producto con compras o ventas registradas.')
    }

    await prisma.producto.delete({ where: { id } })
    revalidatePath('/productos')
    return actionSuccess('Producto eliminado con éxito')
  } catch (error) {
    console.error('Error deleting producto:', error)
    return actionError('Ocurrió un error al eliminar el producto')
  }
}

export async function updateProductStock(id: string, newStock: number): Promise<ActionResult> {
  try {
    if (newStock < 0) return actionError('El stock no puede ser negativo')
    
    await prisma.producto.update({
      where: { id },
      data: { stockActual: newStock }
    })
    
    revalidatePath('/productos')
    return actionSuccess('Stock actualizado correctamente')
  } catch (error) {
    console.error('Error updating stock:', error)
    return actionError('Ocurrió un error al actualizar el stock')
  }
}
