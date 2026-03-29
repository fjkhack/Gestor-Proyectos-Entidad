import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/constants'
import { ArrowLeft, Phone, MapPin, Mail, Calendar } from 'lucide-react'
import ContactHistorialClient from './ContactHistorialClient'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = await params
  const contact = await prisma.contact.findUnique({
    where: { id }
  })
  return {
    title: contact ? `${contact.name} - MerchApp` : 'Contacto no encontrado'
  }
}

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      ventas: {
        orderBy: { fecha: 'desc' },
        include: {
          detalles: {
            include: { producto: true }
          }
        }
      }
    }
  })

  if (!contact) return notFound()

  const totalPagado = contact.ventas
    .filter(v => v.estadoVenta !== 'DEVUELTA' && v.estadoPago === 'PAGADO')
    .reduce((acc, venta) => acc + venta.total, 0)
    
  const totalPendiente = contact.ventas
    .filter(v => v.estadoVenta !== 'DEVUELTA' && v.estadoPago === 'PENDIENTE')
    .reduce((acc, venta) => acc + Math.max(venta.total - venta.montoPagado, 0), 0)

  const ventasEfectivas = contact.ventas.filter(v => v.estadoVenta !== 'DEVUELTA')
  const totalArticulos = ventasEfectivas.reduce((acc, venta) => 
    acc + venta.detalles.reduce((sum, det) => sum + det.cantidad, 0)
  , 0)

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/contactos" className="btn btn-secondary" style={{ padding: '8px' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">Detalle de Contacto</h1>
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', alignItems: 'start' }}>
        
        {/* Profile Card */}
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--warning))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '2rem', fontWeight: 700, marginBottom: '16px'
            }}>
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{contact.name}</h2>
            <div className="badge badge-primary" style={{ marginTop: '8px' }}>Contacto</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
              <Mail size={18} />
              <span>{contact.email || 'Sin email'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
              <Phone size={18} />
              <span>{contact.phone || 'Sin teléfono'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px', color: 'var(--text-secondary)' }}>
              <MapPin size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{contact.notes || 'Sin notas registradas'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <Calendar size={18} />
              <span>Registrado el {formatDate(new Date(contact.createdAt))}</span>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="kpi-grid" style={{ marginBottom: 0 }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Pagado</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(totalPagado)}</div>
            </div>
            <div className="card" style={{ padding: '20px', borderLeft: totalPendiente > 0 ? '4px solid #f59e0b' : 'none' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>A Deber (Fiado)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: totalPendiente > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{formatCurrency(totalPendiente)}</div>
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Artículos Vendidos (Netos)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalArticulos}</div>
            </div>
          </div>

          <ContactHistorialClient ventas={contact.ventas} />

        </div>
      </div>
    </div>
  )
}
