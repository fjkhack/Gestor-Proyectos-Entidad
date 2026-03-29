'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, ChevronDown, ChevronUp, DollarSign, Undo2, ShoppingBag } from 'lucide-react'
import { deleteVenta, markVentaAsPaid, returnVenta, payPartialVenta } from '@/app/actions/venta-actions'
import { useToast } from '@/components/ui/Toast'
import { useModal } from '@/components/ui/ModalProvider'
import { formatDate, formatCurrency } from '@/lib/constants'

type VentaProducto = {
  id: string
  nombre: string
}

type VentaDetalle = {
  id: string
  cantidad: number
  precioUnitario: number
  producto: VentaProducto | null
}

type VentaContact = {
  name: string
} | null

type Venta = {
  id: string
  fecha: Date | string
  total: number
  montoPagado: number
  estadoPago: string
  estadoVenta: string
  notas: string | null
  contact: VentaContact
  detalles: VentaDetalle[]
}

export default function VentasClient({ ventas }: { ventas: Venta[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('TODOS')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const { showToast } = useToast()
  const { confirm, prompt } = useModal()

  const filteredVentas = ventas.filter(v => {
    const contactName = v.contact?.name?.toLowerCase() || ''
    const matchesSearch = contactName.includes(searchTerm.toLowerCase()) || v.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (estadoFilter === 'TODOS') return matchesSearch
    return matchesSearch && v.estadoPago === estadoFilter
  })

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const handleDelete = async (id: string, estadoVenta: string) => {
    await confirm({
      title: 'Eliminar Venta',
      message: estadoVenta === 'DEVUELTA' 
        ? '¿Estás seguro de que deseas eliminar este registro de venta devuelta? No afectará al stock.'
        : '¿Estás seguro de que deseas eliminar esta venta? El stock de los productos será restaurado.',
      type: 'danger',
      confirmText: 'Sí, Eliminar Venta'
    }).then(async (confirmed) => {
      if (confirmed) {
        const result = await deleteVenta(id)
        if (result.success) {
          showToast(result.message || 'Eliminado con éxito', 'success')
        } else {
          showToast(result.message || 'Error al eliminar', 'error')
        }
      }
    })
  }

  const handleMarkAsPaid = async (id: string) => {
    if (await confirm({
      title: 'Marcar como Pagada',
      message: '¿Confirmas que has recibido el pago total de esta venta?',
      type: 'info',
      confirmText: 'Sí, Marcar Pagado'
    })) {
      const result = await markVentaAsPaid(id)
      if (result.success) {
        showToast(result.message || 'Éxito', 'success')
      } else {
        showToast(result.message || 'Error', 'error')
      }
    }
  }

  const handleReturn = async (id: string) => {
    if (await confirm({
      title: 'Devolver Venta',
      message: '¿Estás seguro de que quieres procesar la devolución? Se restaurará el stock y el importe pasará a 0€.',
      type: 'warning',
      confirmText: 'Sí, Procesar Devolución'
    })) {
      const result = await returnVenta(id)
      if (result.success) {
        showToast(result.message || 'Éxito', 'success')
      } else {
        showToast(result.message || 'Error', 'error')
      }
    }
  }

  const handlePartialPayment = async (venta: Venta) => {
    const pendiente = venta.total - venta.montoPagado
    const importe = await prompt({
      title: 'Registrar Abono',
      message: `El cliente debe ${formatCurrency(pendiente)}. ¿Cuánto ha pagado ahora?`,
      defaultValue: pendiente.toString()
    })

    if (importe !== null) {
      const amount = parseFloat(importe)
      if (isNaN(amount) || amount <= 0) {
        showToast('El importe debe ser un número mayor a 0', 'error')
        return
      }

      const result = await payPartialVenta(venta.id, amount)
      if (result.success) {
        showToast(result.message || 'Éxito', 'success')
      } else {
        showToast(result.message || 'Error', 'error')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-8 h-8 text-indigo-600" />
          Historial de Ventas
        </h1>
        <Link 
          href="/ventas/nueva" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={18} /> Nueva Venta
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-3 flex-1 w-full bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
          <Search size={20} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por contacto..." 
            className="flex-1 outline-none text-gray-700 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 w-full sm:w-auto min-w-[180px]" 
          value={estadoFilter} 
          onChange={e => setEstadoFilter(e.target.value)}
        >
          <option value="TODOS">Todos los estados</option>
          <option value="PAGADO">Cobrado</option>
          <option value="PENDIENTE">Fiado (Pendiente)</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-900">
                <th className="px-6 py-4 font-semibold w-12"></th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Cliente / Contacto</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingBag className="w-12 h-12 text-gray-300" />
                      <p>No se encontraron ventas con esos criterios.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVentas.map((venta) => {
                  const isPendiente = venta.estadoPago === 'PENDIENTE' && venta.estadoVenta !== 'DEVUELTA'
                  const isDevuelta = venta.estadoVenta === 'DEVUELTA'
                  
                  return (
                    <Fragment key={venta.id}>
                      <tr 
                        className={`border-b border-gray-50 transition-colors cursor-pointer ${
                          expandedRow === venta.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
                        } ${isDevuelta ? 'opacity-60' : ''}`}
                        onClick={() => toggleRow(venta.id)}
                      >
                        <td className="px-6 py-4 text-gray-400">
                          {expandedRow === venta.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(new Date(venta.fecha))}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {venta.contact?.name || 'Desconocido'}
                          {isDevuelta && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Devuelta</span>}
                        </td>
                        <td className="px-6 py-4">
                          {!isDevuelta ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isPendiente ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isPendiente ? 'Pendiente' : 'Pagado'}
                            </span>
                          ) : '-'}
                        </td>
                        <td className={`px-6 py-4 text-right font-semibold ${isDevuelta ? 'text-gray-500' : 'text-gray-900'}`}>
                          {formatCurrency(venta.total)}
                          {isPendiente && (
                            <div className="text-xs text-amber-600 font-normal mt-0.5">
                              Pagado: {formatCurrency(venta.montoPagado)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            
                            {isPendiente && (
                              <>
                                <button 
                                  onClick={() => handlePartialPayment(venta)} 
                                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                                  title="Registrar Abono"
                                >
                                  <DollarSign size={18} />
                                </button>
                                <button 
                                  onClick={() => handleMarkAsPaid(venta.id)} 
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                  title="Marcar Pagado (Completar)"
                                >
                                  <DollarSign size={18} />
                                </button>
                              </>
                            )}
                            
                            {!isDevuelta && (
                              <button 
                                onClick={() => handleReturn(venta.id)} 
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                title="Devolver Venta"
                              >
                                <Undo2 size={18} />
                              </button>
                            )}
  
                            <button 
                              onClick={() => handleDelete(venta.id, venta.estadoVenta)} 
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                              title="Eliminar Registro"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {expandedRow === venta.id && (
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
                                  {venta.detalles.map((det) => (
                                    <tr key={det.id} className={isDevuelta ? 'opacity-60' : ''}>
                                      <td className="px-4 py-3 font-medium text-gray-900">{det.producto?.nombre || 'Producto eliminado'}</td>
                                      <td className="px-4 py-3 text-right">{det.cantidad}</td>
                                      <td className="px-4 py-3 text-right">{formatCurrency(det.precioUnitario)}</td>
                                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(det.cantidad * det.precioUnitario)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {venta.notas && (
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
                                  <strong className="font-medium text-gray-900">Notas:</strong> {venta.notas}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
