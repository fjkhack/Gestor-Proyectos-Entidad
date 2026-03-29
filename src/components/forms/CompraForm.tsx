'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { createCompra } from '@/app/actions/compra-actions'
import { useToast } from '@/components/ui/Toast'

type Producto = {
  id: string
  nombre: string
  precioVenta: number
  precioCompra: number
  stockActual: number
}

type Contact = {
  id: string
  name: string
}

type CompraLinea = {
  id: number
  productoId: string
  cantidad: number
  precioUnitario: number
}

export default function CompraForm({ productos, contacts }: { productos: Producto[], contacts: Contact[] }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const [contactId, setContactId] = useState('')
  const [notas, setNotas] = useState('')
  const lineIdRef = useRef(1)
  const [lineas, setLineas] = useState<CompraLinea[]>([{ id: 0, productoId: '', cantidad: 1, precioUnitario: 0 }])

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

  const updateLinea = (id: number, field: 'cantidad' | 'precioUnitario', value: number) => {
    setLineas(lineas.map(l => {
      if (l.id === id) {
        return { ...l, [field]: value }
      }
      return l
    }))
  }

  const handleProductSelect = (id: number, productoIdStr: string) => {
    const product = productos.find(p => p.id === productoIdStr)
    setLineas(lineas.map(l => {
      if (l.id === id) {
        return { 
          ...l, 
          productoId: productoIdStr, 
          precioUnitario: product ? product.precioCompra : 0 
        }
      }
      return l
    }))
  }

  const subtotal = lineas.reduce((acc, l) => acc + (l.cantidad * l.precioUnitario), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contactId) {
      showToast('El proveedor es obligatorio', 'error')
      return
    }

    const invalidLine = lineas.find(l => !l.productoId || l.cantidad <= 0 || l.precioUnitario < 0)
    if (invalidLine) {
      showToast('Revisa las líneas de producto. Faltan datos o son incorrectos.', 'error')
      return
    }

    startTransition(async () => {
      const detalles = lineas.map(l => ({
        productoId: l.productoId,
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario)
      }))

      const result = await createCompra(contactId, notas, detalles)
      
      if (result.success) {
        showToast(result.message || 'Éxito', 'success')
        router.push('/compras')
      } else {
        showToast(result.message || 'Ocurrió un error', 'error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm">1</span>
          Datos Generales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900" htmlFor="contactId">Proveedor *</label>
            <select 
              id="contactId"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-700" 
              required 
              value={contactId}
              onChange={e => setContactId(e.target.value)}
            >
              <option value="" disabled>Seleccionar proveedor...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900" htmlFor="notas">Notas / Ref. Pedido</label>
            <input 
              id="notas"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-700" 
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Albarán #12345"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm">2</span>
            Líneas de Compra
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
                <th className="px-4 py-3 font-semibold w-36">Coste Unit. (€)</th>
                <th className="px-4 py-3 font-semibold w-36 text-right">Subtotal</th>
                <th className="px-4 py-3 font-semibold w-16 rounded-tr-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lineas.map((linea) => (
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
                        <option key={p.id} value={p.id}>
                          {p.nombre} (Stock: {p.stockActual})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      min="1" 
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-700" 
                      value={linea.cantidad}
                      onChange={e => updateLinea(linea.id, 'cantidad', Number(e.target.value))}
                    />
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
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(linea.cantidad * linea.precioUnitario)}
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
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-100">
                <td colSpan={3} className="px-4 py-4 text-right font-bold text-gray-700 rounded-bl-lg">TOTAL COMPRA:</td>
                <td className="px-4 py-4 text-right font-bold text-indigo-700 text-lg">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(subtotal)}
                </td>
                <td className="rounded-br-lg"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
        <button 
          type="button" 
          onClick={() => router.push('/compras')} 
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
          <Save size={18} /> {isPending ? 'Guardando Entrada...' : 'Registrar Compra'}
        </button>
      </div>
    </form>
  )
}
