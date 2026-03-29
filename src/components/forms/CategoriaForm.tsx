'use client'

import { useTransition } from 'react'
import { useToast } from '@/components/ui/Toast'
import { createCategoria, editCategoria } from '@/app/actions/categoria-actions'
import { X, Save } from 'lucide-react'

type CategoriaProps = {
  id?: string
  nombre?: string
}

export default function CategoriaForm({ 
  categoria = {}, 
  onClose 
}: { 
  categoria?: CategoriaProps, 
  onClose: () => void 
}) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  
  const isEditing = !!categoria.id

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      let result
      if (isEditing) {
        result = await editCategoria(categoria.id!, formData)
      } else {
        result = await createCategoria(formData)
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
        <label className="text-sm font-medium text-gray-700" htmlFor="nombre">Nombre de la Categoría *</label>
        <input 
          id="nombre"
          name="nombre"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
          required 
          defaultValue={categoria.nombre || ''}
          placeholder="Ej: Sudaderas"
        />
        <span className="text-xs text-gray-500 mt-1 block">
          El nombre debe ser único.
        </span>
      </div>

      <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-100">
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
          <Save size={16} /> {isPending ? 'Guardando...' : 'Guardar Categoría'}
        </button>
      </div>
    </form>
  )
}
