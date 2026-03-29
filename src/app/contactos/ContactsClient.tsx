'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, Users } from 'lucide-react'
import ContactForm from '@/components/forms/ContactForm'
import { deleteContact } from '@/app/actions/contact-actions'
import { useToast } from '@/components/ui/Toast'
import { useModal } from '@/components/ui/ModalProvider'
import { formatDate } from '@/lib/constants'

type Contact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  createdAt: Date | string
  type?: string
  nif?: string | null
  notes?: string | null
}

export default function ContactsClient({ contacts }: { contacts: Contact[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const { showToast } = useToast()
  const { confirm } = useModal()

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (await confirm({
      title: 'Eliminar Contacto',
      message: '¿Estás seguro de que deseas eliminar este contacto?',
      type: 'danger',
      confirmText: 'Sí, Eliminar'
    })) {
      const result = await deleteContact(id)
      if (result.success) {
        showToast(result.message || 'Eliminado con éxito', 'success')
      } else {
        showToast(result.message || 'Error al eliminar', 'error')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-8 h-8 text-indigo-600" />
          Agenda de Contactos
        </h1>
        <button 
          onClick={() => { setEditingContact(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={18} /> Nuevo Contacto
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search size={20} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o email..." 
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
                <th className="px-6 py-4 font-semibold">Nombre</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Registro</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p>No se encontraron contactos.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{contact.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{contact.email || '-'}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{contact.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(new Date(contact.createdAt))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/contactos/${contact.id}`} 
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </Link>
                        <button 
                          onClick={() => handleEdit(contact)} 
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar contacto"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(contact.id)} 
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar contacto"
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
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h2>
            </div>
            <div className="p-6 overflow-y-auto">
                <ContactForm 
                  contact={editingContact || undefined} 
                  onClose={() => setIsModalOpen(false)} 
                />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
