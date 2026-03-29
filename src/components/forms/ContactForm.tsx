'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { createContact, editContact } from '@/app/actions/contact-actions'
import { X, Save } from 'lucide-react'

type ContactProps = {
  id?: string
  name?: string
  email?: string | null
  phone?: string | null
  notes?: string | null
}

export default function ContactForm({ 
  contact = {}, 
  onClose 
}: { 
  contact?: ContactProps, 
  onClose?: () => void 
}) {
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  const router = useRouter()
  
  const isEditing = !!contact.id

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      let result
      if (isEditing) {
        result = await editContact(contact.id!, formData)
      } else {
        result = await createContact(formData)
      }

      if (result.success) {
        showToast(result.message || 'Contacto guardado', 'success')
        if (onClose) onClose()
        else router.push('/contactos')
      } else {
        showToast(result.message || 'Error al guardar', 'error')
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="nombre">Nombre Completo *</label>
        <input 
          id="nombre"
          name="nombre"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
          required 
          defaultValue={contact.name || ''}
          placeholder="Ej: Juan Pérez"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
          <input 
            id="email"
            name="email"
            type="email"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
            defaultValue={contact.email || ''}
            placeholder="juan@ejemplo.com"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700" htmlFor="telefono">Teléfono</label>
          <input 
            id="telefono"
            name="telefono"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
            defaultValue={contact.phone || ''}
            placeholder="+34 600..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="direccion">Notas / Dirección</label>
        <textarea 
          id="direccion"
          name="direccion"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y" 
          rows={3}
          defaultValue={contact.notes || ''}
          placeholder="Ej: Calle Principal 123 u otra nota..."
        />
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
            disabled={isPending}
          >
            <X size={16} /> Cancelar
          </button>
        )}
        <button 
          type="submit" 
          className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          disabled={isPending}
        >
          <Save size={16} /> {isPending ? 'Guardando...' : 'Guardar Contacto'}
        </button>
      </div>
    </form>
  )
}
