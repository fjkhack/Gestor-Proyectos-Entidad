'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import { deleteCompra } from '@/app/actions/compra-actions'
import { useToast } from '@/components/ui/Toast'
import { useModal } from '@/components/ui/ModalProvider'
import { formatDate, formatCurrency } from '@/lib/constants'

type CompraDetalle = {
  id: string
  cantidad: number
  precioUnitario: number
  producto: {
    nombre: string
  } | null
}

type Compra = {
  id: string
  fecha: Date | string
  total: number
  notas: string | null
  contact: {
    name: string
  } | null
  detalles: CompraDetalle[]
}

export default function ComprasClient({ compras }: { compras: Compra[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const { showToast } = useToast()
  const { confirm } = useModal()

  const filteredCompras = compras.filter(c => 
    c.contact?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.id && c.id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const handleDelete = async (id: string) => {
    if (await confirm({
      title: 'Eliminar Compra',
      message: '¿Estás seguro de que deseas eliminar esta compra? Se restará el stock de los productos incluidos.',
      type: 'danger',
      confirmText: 'Sí, Eliminar'
    })) {
      const result = await deleteCompra(id)
      if (result.success) {
        showToast(result.message || 'Eliminado con éxito', 'success')
      } else {
        showToast(result.message || 'Ocurrió un error', 'error')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-8 h-8 text-indigo-600" />
          Historial de Compras
        </h1>
        <Link 
          href="/compras/nueva" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={18} /> Nueva Compra
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search size={20} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por proveedor o ID de compra..." 
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
                <th className="px-6 py-4 font-semibold w-12"></th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Proveedor</th>
                <th className="px-6 py-4 font-semibold">Notas / Albarán</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingCart className="w-12 h-12 text-gray-300" />
                      <p>No se encontraron compras.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompras.map((compra) => (
                  <Fragment key={compra.id}>
                    <tr 
                      className={`border-b border-gray-50 transition-colors cursor-pointer ${expandedRow === compra.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                        onClick={() => toggleRow(compra.id)}
                    >
                      <td className="px-6 py-4 text-gray-400">
                        {expandedRow === compra.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(new Date(compra.fecha))}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{compra.contact?.name || 'Desconocido'}</td>
                      <td className="px-6 py-4 text-gray-500">{compra.notas || '-'}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(compra.total)}</td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleDelete(compra.id)} 
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar Compra"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {expandedRow === compra.id && (
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <td></td>
                        <td colSpan={5} className="px-6 py-4">
                          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm text-gray-600">
                              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-3 font-semibold">Producto</th>
                                  <th className="px-4 py-3 font-semibold text-right">Cantidad</th>
                                  <th className="px-4 py-3 font-semibold text-right">Precio Unit.</th>
                                  <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {compra.detalles.map((det) => (
                                  <tr key={det.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{det.producto?.nombre || 'Producto eliminado'}</td>
                                    <td className="px-4 py-3 text-right">{det.cantidad}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(det.precioUnitario)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(det.cantidad * det.precioUnitario)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
