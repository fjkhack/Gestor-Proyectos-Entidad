'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Search, Edit, Trash2, Package, ArrowUpDown, Copy, Box } from 'lucide-react'
import ProductoForm from '@/components/forms/ProductoForm'
import { deleteProducto, updateProductStock } from '@/app/actions/producto-actions'
import { useToast } from '@/components/ui/Toast'
import { useModal } from '@/components/ui/ModalProvider'
import { formatCurrency } from '@/lib/constants'

type Categoria = {
  id: string
  nombre: string
}

type Producto = {
  id: string
  nombre: string
  categoriaId: string
  precioVenta: number
  stockActual: number
  imagen: string | null
  categoria: Categoria | null
}

type EditableProducto = {
  id?: string
  nombre?: string
  categoriaId?: string
  precioVenta?: number
  precioCompra?: number
  stockActual?: number
  imagen?: string | null
}

export default function ProductosClient({ productos, categorias }: { productos: Producto[], categorias: Categoria[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<EditableProducto | null>(null)
  const { showToast } = useToast()
  const { confirm, prompt } = useModal()

  // Extract unique categories from actual products (now via relation)
  const categoriasUnicas = Array.from(new Set(productos.map(p => p.categoria?.nombre || '')))

  const filteredProductos = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = categoriaFilter ? (p.categoria?.nombre === categoriaFilter) : true
    return matchesSearch && matchesCat
  })

  const handleEdit = (producto: Producto) => {
    setEditingProducto({
      ...producto,
      categoriaId: producto.categoriaId // Ensure categoriaId is explicitly passed
    })
    setIsModalOpen(true)
  }

  const handleDuplicate = (producto: Producto) => {
    setEditingProducto({
      ...producto,
      id: undefined,
      nombre: `${producto.nombre} (Copia)`,
      stockActual: 0,
      categoriaId: producto.categoriaId
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (await confirm({
      title: 'Eliminar Producto',
      message: '¿Estás seguro de que deseas eliminar este producto?',
      type: 'danger',
      confirmText: 'Sí, Eliminar'
    })) {
      const result = await deleteProducto(id)
      if (result.success) {
        showToast(result.message || 'Éxito', 'success')
      } else {
        showToast(result.message || 'Error', 'error')
      }
    }
  }

  const handleAdjustStock = async (producto: Producto) => {
    const defaultVal = producto.stockActual
    const str = await prompt({
      title: 'Ajustar Stock Manualmente',
      message: `Ajustar stock para "${producto.nombre}".\nIntroduce el nuevo stock total (actual: ${defaultVal} u.):`,
      defaultValue: defaultVal.toString()
    })
    if (str === null) return // Canceled
    
    const newStock = parseInt(str, 10)
    if (isNaN(newStock) || newStock < 0) {
      showToast('Por favor, introduce un número válido mayor o igual a 0', 'error')
      return
    }
    
    const result = await updateProductStock(producto.id, newStock)
    if (result.success) showToast(result.message || 'Actualizado', 'success')
    else showToast(result.message || 'Error al actualizar', 'error')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Box className="w-8 h-8 text-indigo-600" />
          Catálogo de Productos
        </h1>
        <button 
          onClick={() => { setEditingProducto(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-3 flex-1 w-full bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
          <Search size={20} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar producto por nombre..." 
            className="flex-1 outline-none text-gray-700 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-gray-500 text-sm font-medium whitespace-nowrap">Categoría:</label>
          <select 
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 min-w-[150px]" 
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {categoriasUnicas.map(cat => (
              <option key={cat as string} value={cat as string}>{cat as string}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-900">
                <th className="px-6 py-4 font-semibold w-16">Img</th>
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold text-right">Precio</th>
                <th className="px-6 py-4 font-semibold text-right">Stock</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Box className="w-12 h-12 text-gray-300" />
                      <p>No se encontraron productos.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProductos.map((producto) => (
                  <tr key={producto.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-gray-400">
                        {producto.imagen ? (
                          <Image
                            src={producto.imagen}
                            alt={producto.nombre}
                            width={48}
                            height={48}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={24} />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{producto.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {producto.categoria?.nombre || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(producto.precioVenta)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        producto.stockActual > 5 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : producto.stockActual > 0 
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {producto.stockActual} u.
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleAdjustStock(producto)} 
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ajustar Stock Manualmente"
                        >
                          <ArrowUpDown size={18} />
                        </button>
                        <button 
                          onClick={() => handleDuplicate(producto)} 
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Duplicar Producto"
                        >
                          <Copy size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(producto)} 
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar Producto"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(producto.id)} 
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
            </div>
            <div className="p-6 overflow-y-auto">
              <ProductoForm 
                producto={editingProducto || undefined} 
                categorias={categorias}
                onClose={() => setIsModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
