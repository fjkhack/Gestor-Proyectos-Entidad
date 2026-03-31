'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ChevronDown, ChevronUp, Wallet, Undo2, ShoppingBag, CheckCircle2, RotateCcw } from 'lucide-react'
import { deleteVenta, markVentaAsPaid, returnVenta, payPartialVenta, returnVentaPartial } from '@/app/actions/venta-actions'
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
  id: string
  name: string
  email?: string | null
} | null

type VentaMovimiento = {
  id: string
  tipo: string
  resumen: string
  monto: number | null
  total: number
  montoPagado: number
  deuda: number
  createdAt: Date | string
}

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
  movimientos?: VentaMovimiento[]
}

export default function VentasClient({ ventas }: { ventas: Venta[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('TODOS')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [copyEmail, setCopyEmail] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [returningVenta, setReturningVenta] = useState<Venta | null>(null)
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({})
  const { showToast } = useToast()
  const { confirm, prompt } = useModal()

  const filteredVentas = ventas.filter(v => {
    const contactName = v.contact?.name?.toLowerCase() || ''
    const matchesSearch = contactName.includes(searchTerm.toLowerCase()) || v.id.toLowerCase().includes(searchTerm.toLowerCase())
    const ventaDate = new Date(v.fecha)
    const minDate = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null
    const maxDate = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999`) : null
    const matchesDateFrom = !minDate || ventaDate.getTime() >= minDate.getTime()
    const matchesDateTo = !maxDate || ventaDate.getTime() <= maxDate.getTime()
    const matchesDate = matchesDateFrom && matchesDateTo
    
    if (estadoFilter === 'TODOS') return matchesSearch && matchesDate
    return matchesSearch && matchesDate && v.estadoPago === estadoFilter
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
        const result = await deleteVenta(id, copyEmail || null)
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
      const result = await markVentaAsPaid(id, copyEmail || null)
      if (result.success) {
        showToast(result.message || 'Éxito', 'success')
      } else {
        showToast(result.message || 'Error', 'error')
      }
    }
  }

  const handleReturn = async (venta: Venta) => {
    const refundMsg = venta.montoPagado > 0
      ? `\n\nIMPORTANTE: el cliente ya abonó ${formatCurrency(venta.montoPagado)} y debes devolvérselo.`
      : ''

    if (await confirm({
      title: 'Devolver Venta',
      message: `¿Estás seguro de que quieres procesar la devolución? Se restaurará el stock y el importe pasará a 0€.${refundMsg}`,
      type: 'warning',
      confirmText: 'Sí, Procesar Devolución'
    })) {
      const result = await returnVenta(venta.id, copyEmail || null)
      if (result.success) {
        showToast(result.message || 'Éxito', 'success')
      } else {
        showToast(result.message || 'Error', 'error')
      }
    }
  }

  const openPartialReturn = (venta: Venta) => {
    const initialQtys = venta.detalles.reduce<Record<string, number>>((acc, det) => {
      acc[det.id] = 0
      return acc
    }, {})
    setReturnQtys(initialQtys)
    setReturningVenta(venta)
  }

  const handlePartialReturnSubmit = async () => {
    if (!returningVenta) return

    const items = returningVenta.detalles
      .map((det) => ({ detalleId: det.id, cantidad: Math.floor(Number(returnQtys[det.id] || 0)) }))
      .filter((item) => item.cantidad > 0)

    if (items.length === 0) {
      showToast('Selecciona al menos una cantidad para devolver', 'error')
      return
    }

    const result = await returnVentaPartial(returningVenta.id, items, copyEmail || null)
    if (result.success) {
      showToast(result.message || 'Devolución parcial registrada', 'success')
      setReturningVenta(null)
      setReturnQtys({})
    } else {
      showToast(result.message || 'Error al procesar la devolución parcial', 'error')
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

      const result = await payPartialVenta(venta.id, amount, copyEmail || null)
      if (result.success) {
        showToast(result.message || 'Éxito', 'success')
      } else {
        showToast(result.message || 'Error', 'error')
      }
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setEstadoFilter('TODOS')
    setFechaDesde('')
    setFechaHasta('')
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
        <p className="text-sm text-gray-600 w-full sm:w-auto sm:flex-1">
          Usa los filtros de la cabecera para cliente, estado y fecha.
        </p>
        <input
          type="email"
          value={copyEmail}
          onChange={(e) => setCopyEmail(e.target.value)}
          placeholder="Email copia movimientos (opcional)"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 w-full sm:w-[300px]"
        />
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
              <tr className="bg-white border-b border-gray-100">
                <th className="px-6 py-3"></th>
                <th className="px-6 py-3">
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="date"
                      aria-label="Filtrar fecha desde"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                    />
                    <input
                      type="date"
                      aria-label="Filtrar fecha hasta"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                    />
                  </div>
                </th>
                <th className="px-6 py-3">
                  <input
                    type="text"
                    placeholder="Filtrar cliente o ID..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </th>
                <th className="px-6 py-3">
                  <select
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                  >
                    <option value="TODOS">Todos</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="PENDIENTE">Pendiente</option>
                  </select>
                </th>
                <th className="px-6 py-3"></th>
                <th className="px-6 py-3 text-right">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Limpiar filtros
                  </button>
                </th>
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
                  const isPartialReturn = venta.estadoVenta === 'PARCIALMENTE_DEVUELTA'
                  const restante = Math.max(venta.total - venta.montoPagado, 0)
                  
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
                          {isPartialReturn && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Devolución parcial</span>}
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
                          {(isPendiente || venta.montoPagado > 0) && (
                            <div className="text-xs text-amber-600 font-normal mt-0.5">
                              Pagado: {formatCurrency(venta.montoPagado)}
                            </div>
                          )}
                          {(isPendiente || restante > 0) && (
                            <div className="text-xs text-red-600 font-semibold mt-0.5">
                              Debe: {formatCurrency(restante)}
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
                                  <Wallet size={18} />
                                </button>
                                <button 
                                  onClick={() => handleMarkAsPaid(venta.id)} 
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                  title="Marcar Pagado (Completar)"
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                              </>
                            )}
                             
                            {!isDevuelta && (
                              <>
                                <button 
                                  onClick={() => openPartialReturn(venta)} 
                                  className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors" 
                                  title="Devolución parcial"
                                >
                                  <Undo2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleReturn(venta)} 
                                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                  title="Devolución total"
                                >
                                  <RotateCcw size={18} />
                                </button>
                              </>
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
                              {venta.movimientos && venta.movimientos.length > 0 && (
                                <div className="px-4 py-3 border-t border-gray-100 bg-slate-50">
                                  <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-600 mb-2">Registro de movimientos</h4>
                                  <div className="space-y-2">
                                    {venta.movimientos.map((mov) => (
                                      <div key={mov.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                        <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                                          <span className="font-semibold text-slate-700">{mov.tipo}</span>
                                          <span>{formatDate(new Date(mov.createdAt))}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 mt-1">{mov.resumen}</p>
                                        <div className="text-xs text-slate-500 mt-1">
                                          Total: {formatCurrency(mov.total)} · Pagado: {formatCurrency(mov.montoPagado)} · Debe: {formatCurrency(mov.deuda)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
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

      {returningVenta && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Devolución parcial de venta</h3>
              <button
                onClick={() => setReturningVenta(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-slate-600">
                Selecciona cuántas unidades devolver por producto. Solo puedes devolver hasta la cantidad vendida.
              </p>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-right">Vendidas</th>
                      <th className="px-4 py-3 text-right">A devolver</th>
                      <th className="px-4 py-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returningVenta.detalles.map((det) => {
                      const qty = Number(returnQtys[det.id] || 0)
                      const safeQty = Number.isFinite(qty) ? qty : 0
                      const cappedQty = Math.max(0, Math.min(det.cantidad, safeQty))
                      return (
                        <tr key={det.id}>
                          <td className="px-4 py-3 font-medium text-slate-900">{det.producto?.nombre || 'Producto eliminado'}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{det.cantidad}</td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min={0}
                              max={det.cantidad}
                              step={1}
                              value={cappedQty}
                              onChange={(e) => {
                                const next = Number(e.target.value)
                                const normalized = Number.isFinite(next)
                                  ? Math.max(0, Math.min(det.cantidad, Math.floor(next)))
                                  : 0
                                setReturnQtys((prev) => ({ ...prev, [det.id]: normalized }))
                              }}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(cappedQty * det.precioUnitario)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setReturningVenta(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handlePartialReturnSubmit}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Confirmar devolución parcial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
