'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Tags, Layers } from 'lucide-react'
import CategoriaForm from '@/components/forms/CategoriaForm'
import { deleteCategoria } from '@/app/actions/categoria-actions'
import { useToast } from '@/components/ui/Toast'
import { useModal } from '@/components/ui/ModalProvider'
import { formatDate } from '@/lib/constants'

type Categoria = {
  id: string
  nombre: string
  createdAt: Date | string
  _count: {
    productos: number
  }
}

export default function CategoriasClient({ categorias }: { categorias: Categoria[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const { showToast } = useToast()
  const { confirm } = useModal()

  const filteredCategorias = categorias.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (await confirm({
      title: 'Eliminar Categoría',
      message: '¿Estás seguro de que deseas eliminar esta categoría? Solo se podrá si no tiene productos.',
      type: 'danger',
      confirmText: 'Sí, Eliminar'
    })) {
      const result = await deleteCategoria(id)
      if (result.success) {
        showToast(result.message || 'Exito', 'success')
      } else {
        showToast(result.message || 'Ocurrió un error', 'error')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-8 h-8 text-indigo-600" />
          Gestión de Categorías
        </h1>
        <button 
          onClick={() => { setEditingCategoria(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={18} /> Nueva Categoría
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search size={20} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar categoría por nombre..." 
          className="flex-1 outline-none text-gray-700 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-900">
                <th className="px-6 py-4 font-semibold w-16"></th>
                <th className="px-6 py-4 font-semibold">Nombre de Categoría</th>
                <th className="px-6 py-4 font-semibold">Nº de Productos</th>
                <th className="px-6 py-4 font-semibold">Fecha Creación</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategorias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="w-12 h-12 text-gray-300" />
                      <p>No se encontraron categorías.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategorias.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Tags size={20} />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{cat.nombre}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {cat._count.productos} productos
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(new Date(cat.createdAt))}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(cat)} 
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          aria-label="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)} 
                          className={`p-2 rounded-lg transition-colors ${cat._count.productos > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                          disabled={cat._count.productos > 0}
                          aria-label="Eliminar"
                          title={cat._count.productos > 0 ? "No se puede eliminar porque tiene productos" : "Eliminar"}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
            </div>
            <div className="p-6 overflow-y-auto">
              <CategoriaForm 
                categoria={editingCategoria || {}} 
                onClose={() => setIsModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
