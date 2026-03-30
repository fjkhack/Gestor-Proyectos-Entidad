'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, X, FolderOpen } from 'lucide-react'
import { createVenta } from '@/app/actions/venta-actions'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/constants'

type Producto = {
  id: string
  nombre: string
  precioVenta: number
  stockActual: number
}

type Contact = {
  id: string
  name: string
}

type Project = {
  id: string
  title: string
}

type VentaLinea = {
  id: number
  productoId: string
  cantidad: number
  precioUnitario: number
}

export default function VentaForm({
  productos,
  contacts,
  projects,
}: {
  productos: Producto[]
  contacts: Contact[]
  projects: Project[]
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [contactId, setContactId] = useState('')
  const [notas, setNotas] = useState('')
  const [estadoPago, setEstadoPago] = useState('PAGADO')
  const [projectId, setProjectId] = useState('')
  const [copyEmail, setCopyEmail] = useState('')
  const lineIdRef = useRef(1)
  const [lineas, setLineas] = useState<VentaLinea[]>([
    { id: 0, productoId: '', cantidad: 1, precioUnitario: 0 }
  ])

  const nextLineId = () => {
    lineIdRef.current += 1
    return lineIdRef.current
  }

  const addLinea = () => {
    setLineas([...lineas, { id: nextLineId(), productoId: '', cantidad: 1, precioUnitario: 0 }])
  }

  const removeLinea = (id: number) => {
    if (lineas.length === 1) return
    setLineas(lineas.filter(l => l.id !== id))
  }

  const handleProductSelect = (id: number, productoIdStr: string) => {
    const product = productos.find(p => p.id === productoIdStr)
    setLineas(lineas.map(l => {
      if (l.id === id) {
        return {
          ...l,
          productoId: productoIdStr,
          precioUnitario: product ? product.precioVenta : 0
        }
      }
      return l
    }))
  }

  const updateLinea = (id: number, field: 'cantidad' | 'precioUnitario', value: number) => {
    setLineas(lineas.map(l => {
      if (l.id === id) {
        return { ...l, [field]: value }
      }
      return l
    }))
  }

  const subtotal = lineas.reduce((acc, l) => acc + (l.cantidad * l.precioUnitario), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!contactId) {
      showToast('Debe seleccionar un cliente/contacto', 'error')
      return
    }

    const invalidLine = lineas.find(l => !l.productoId || l.cantidad <= 0 || l.precioUnitario < 0)
    if (invalidLine) {
      showToast('Revisa las líneas de producto. Faltan datos o son incorrectos.', 'error')
      return
    }

    // Client-side stock validation
    for (const linea of lineas) {
      const product = productos.find(p => p.id === linea.productoId)
      if (product && product.stockActual < linea.cantidad) {
        showToast(`Stock insuficiente para "${product.nombre}". Disponible: ${product.stockActual}.`, 'error')
        return
      }
    }

    startTransition(async () => {
      const detalles = lineas.map(l => ({
        productoId: l.productoId,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario)
      }))

      const result = await createVenta(
        contactId,
        notas,
        estadoPago,
        detalles,
        projectId || null,
        copyEmail || null
      )

      if (result.success) {
        showToast(result.message || 'Éxito', 'success')
        router.push('/ventas')
      } else {
        showToast(result.message || 'Error', 'error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm">1</span>
          Datos de la Venta
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900" htmlFor="contactId">Cliente / Contacto *</label>
            <select
              id="contactId"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-700"
              required
              value={contactId}
              onChange={e => setContactId(e.target.value)}
            >
              <option value="" disabled>Seleccionar cliente...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900" htmlFor="estadoPago">Estado de Pago *</label>
            <select
              id="estadoPago"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-700"
              required
              value={estadoPago}
              onChange={e => setEstadoPago(e.target.value)}
            >
              <option value="PAGADO">Cobrado (Pagado)</option>
              <option value="PENDIENTE">Fiado (Pendiente)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 flex items-center gap-1.5" htmlFor="projectId">
              <FolderOpen className="w-4 h-4 text-indigo-500" />
              Vincular a Proyecto
              <span className="text-xs text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              id="projectId"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-700"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
            >
              <option value="">Sin proyecto</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {projectId && (
              <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                <span>✓</span> Se creará un ingreso automático en el proyecto
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900" htmlFor="notas">Notas / Observaciones</label>
            <input
              id="notas"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-700"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Entregado en mano"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900" htmlFor="copyEmail">Email copia de movimientos</label>
            <input
              id="copyEmail"
              type="email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-700"
              value={copyEmail}
              onChange={e => setCopyEmail(e.target.value)}
              placeholder="tu-email@dominio.com (opcional)"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm">2</span>
            Productos Vendidos
          </h2>
          <button
            type="button"
            onClick={addLinea}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
          >
            <Plus size={16} /> Añadir Producto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-900 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold rounded-tl-lg">Producto</th>
                <th className="px-4 py-3 font-semibold w-32">Cantidad</th>
                <th className="px-4 py-3 font-semibold w-36">Precio Unit. (€)</th>
                <th className="px-4 py-3 font-semibold w-36 text-right">Subtotal</th>
                <th className="px-4 py-3 font-semibold w-16 rounded-tr-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lineas.map((linea) => {
                const isOverStock = (() => {
                  if (!linea.productoId) return false
                  const prod = productos.find(p => p.id === linea.productoId)
                  return prod && prod.stockActual < linea.cantidad
                })()

                return (
                  <tr key={linea.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <select
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-700"
                        value={linea.productoId}
                        required
                        onChange={e => handleProductSelect(linea.id, e.target.value)}
                      >
                        <option value="" disabled>Seleccionar producto...</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stockActual === 0}>
                            {p.nombre} (Disp: {p.stockActual})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        required
                        className={`w-full px-3 py-2 bg-white border rounded-lg outline-none focus:ring-1 transition-all text-gray-700 ${
                          isOverStock
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
                        }`}
                        value={linea.cantidad}
                         onChange={e => updateLinea(linea.id, 'cantidad', Number(e.target.value))}
                      />
                      {isOverStock && <span className="text-red-500 text-xs block mt-1 font-medium">Excede stock</span>}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-700"
                        value={linea.precioUnitario}
                         onChange={e => updateLinea(linea.id, 'precioUnitario', Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 align-middle">
                      {formatCurrency(linea.cantidad * linea.precioUnitario)}
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => removeLinea(linea.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          lineas.length === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        disabled={lineas.length === 1}
                        title="Eliminar línea"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-100">
                <td colSpan={3} className="px-4 py-4 text-right font-bold text-gray-700 rounded-bl-lg">TOTAL VENTA:</td>
                <td className="px-4 py-4 text-right font-bold text-indigo-700 text-lg">
                  {formatCurrency(subtotal)}
                </td>
                <td className="rounded-br-lg"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Aviso de ingreso automático */}
      {projectId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <FolderOpen className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">Ingreso automático activado</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Al guardar, se creará un ingreso de tipo <strong>VENTA</strong> en el proyecto seleccionado
              por un importe de <strong>{formatCurrency(subtotal)}</strong>.
              Si eliminas o devuelves esta venta, el ingreso también se eliminará.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.push('/ventas')}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 w-full sm:w-auto"
          disabled={isPending}
        >
          <X size={18} /> Cancelar
        </button>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          disabled={isPending}
        >
          <Save size={18} /> {isPending ? 'Procesando...' : 'Confirmar Venta'}
        </button>
      </div>
    </form>
  )
}
