'use client'

import { useTransition } from 'react'
import { useToast } from '@/components/ui/Toast'
import { createProducto, editProducto } from '@/app/actions/producto-actions'
import { X, Save } from 'lucide-react'

type ProductoProps = {
  id?: string
  nombre?: string
  categoriaId?: string
  precioVenta?: number
  precioCompra?: number
  stockActual?: number
  imagen?: string | null
}

type CategoriaOption = {
  id: string
  nombre: string
}

export default function ProductoForm({ 
  producto = {}, 
  categorias = [],
  onClose 
}: { 
  producto?: ProductoProps,
  categorias?: CategoriaOption[],
  onClose: () => void 
}) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  
  const isEditing = !!producto.id

  async function handleSubmit(formData: FormData) {
    const file = formData.get('imagenArchivo') as File | null
    if (file && file.size > 4 * 1024 * 1024) {
      showToast('La imagen es demasiado grande. El límite es de 4 MB.', 'error')
      return
    }

    startTransition(async () => {
      let result
      if (isEditing) {
        result = await editProducto(producto.id!, formData)
      } else {
        result = await createProducto(formData)
      }

      if (result.success) {
        showToast(result.message || 'Guardado', 'success')
        onClose()
      } else {
        showToast(result.message || 'Error al guardar', 'error')
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="nombre">Nombre del Producto *</label>
        <input 
          id="nombre"
          name="nombre"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
          required 
          defaultValue={producto.nombre || ''}
          placeholder="Ej: Camiseta Negra Logo Frontal M"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="categoriaId">Categoría *</label>
          <select 
            id="categoriaId" 
            name="categoriaId" 
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white" 
            required 
            defaultValue={producto.categoriaId || ''}
          >
            <option value="" disabled>Seleccionar...</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="precioCompra">Coste Compra (€)</label>
          <input 
            id="precioCompra"
            name="precioCompra"
            type="number"
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
            defaultValue={producto.precioCompra || 0}
            placeholder="5.00"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="precioVenta">Precio Venta (€) *</label>
          <input 
            id="precioVenta"
            name="precioVenta"
            type="number"
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
            required 
            defaultValue={producto.precioVenta || ''}
            placeholder="15.00"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="stockActual">Stock Actual</label>
        <input 
          id="stockActual"
          name="stockActual"
          type="number"
          min="0"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
          defaultValue={producto.stockActual || 0}
          placeholder="0"
        />
        <span className="text-xs text-gray-500 mt-1 block">
          Puedes ajustar el stock manualmente aquí si es necesario.
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="imagenArchivo">Subir Imagen</label>
        {producto.imagen && <input type="hidden" name="existingImagen" value={producto.imagen} />}
        <input 
          id="imagenArchivo"
          name="imagenArchivo"
          type="file"
          accept="image/*"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer" 
        />
        {producto.imagen && (
          <span className="text-xs text-gray-500 mt-1 block">
            Imagen actual guardada. Sube una nueva solo si deseas reemplazarla.
          </span>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
        <button 
          type="button" 
          onClick={onClose} 
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
          disabled={isPending}
        >
          <X size={16} /> Cancelar
        </button>
        <button 
          type="submit" 
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          disabled={isPending}
        >
          <Save size={16} /> {isPending ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </div>
    </form>
  )
}
