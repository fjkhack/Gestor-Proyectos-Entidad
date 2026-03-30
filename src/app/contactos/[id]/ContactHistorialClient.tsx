'use client'

import { useState } from 'react'
import { ShoppingBag, CheckCircle, RotateCcw, Wallet } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/constants'
import { markVentaAsPaid, payPartialVenta, returnVenta } from '@/app/actions/venta-actions'
import { useToast } from '@/components/ui/Toast'
import { useModal } from '@/components/ui/ModalProvider'

type VentaDetalle = {
  id: string
  cantidad: number
  precioUnitario: number
  producto: {
    nombre: string
  } | null
}

type Venta = {
  id: string
  fecha: Date | string
  total: number
  montoPagado: number
  estadoPago: string
  estadoVenta: string
  notas: string | null
  detalles: VentaDetalle[]
}

export default function ContactHistorialClient({ ventas }: { ventas: Venta[] }) {
  const [copyEmail, setCopyEmail] = useState('')
  const { showToast } = useToast()
  const { confirm, prompt } = useModal()
  
  const handleMarkAsPaid = async (id: string) => {
    if (await confirm({
      title: 'Confirmar Cobro',
      message: '¿Marcar este ticket completo como cobrado?'
    })) {
      const result = await markVentaAsPaid(id, copyEmail || null)
      if (result.success) showToast(result.message || 'Éxito', 'success')
      else showToast(result.message || 'Error', 'error')
    }
  }

  const handlePartialPayment = async (venta: Venta) => {
    const pendiente = venta.total - (venta.montoPagado || 0)
    const str = await prompt({
      title: 'Abonar a cuenta',
      message: `Deuda actual: ${formatCurrency(pendiente)}. ¿Cuánto entrega el cliente ahora?`,
      defaultValue: pendiente.toString()
    })
    if (!str) return
    
    // allow comma or dot
    const importe = parseFloat(str.replace(',', '.'))
    if (isNaN(importe) || importe <= 0) {
      showToast('Por favor, introduce un importe válido mayor que 0', 'error')
      return
    }

    if (importe > pendiente) {
      if (!await confirm({
        title: 'Importe superior',
        message: `El importe introducido (${formatCurrency(importe)}) es mayor que la deuda (${formatCurrency(pendiente)}). ¿Continuar de todas formas y marcar como superado?`,
        type: 'warning'
      })) {
        return
      }
    }

    const result = await payPartialVenta(venta.id, importe, copyEmail || null)
    if (result.success) showToast(result.message || 'Éxito', 'success')
    else showToast(result.message || 'Error', 'error')
  }

  const handleReturn = async (venta: Venta) => {
    let mensaje = 'Devolver esta venta restaurará el stock y la anulará contablemente.\n\n'
    if (venta.montoPagado > 0) {
      mensaje += `⚠️ IMPORTANTE: El cliente había pagado ${formatCurrency(venta.montoPagado)}.\nDEBES DEVOLVERLE ESTE IMPORTE.\n\n`
    }
    mensaje += '¿Proceder con la devolución?'

    if (await confirm({
      title: 'Confirmar Devolución',
      message: mensaje,
      type: 'danger',
      confirmText: 'Sí, Devolver'
    })) {
      const result = await returnVenta(venta.id, copyEmail || null)
      if (result.success) showToast(result.message || 'Éxito', 'success')
      else showToast(result.message || 'Error', 'error')
    }
  }

  if (ventas.length === 0) {
    return (
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} className="text-primary" /> Historial de Compras
        </h3>
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
          Este contacto no ha participado en ninguna compra/venta todavía.
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShoppingBag size={20} className="text-primary" /> Historial de Ventas
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="email"
          value={copyEmail}
          onChange={(e) => setCopyEmail(e.target.value)}
          placeholder="Email copia de movimientos (opcional)"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'white',
          }}
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {ventas.map((venta) => (
          <div key={venta.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Fecha: {formatDate(new Date(venta.fecha))}</div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {venta.estadoVenta === 'DEVUELTA' ? (
                    <span className="badge badge-danger">DEVUELTA</span>
                  ) : venta.estadoVenta === 'PARCIALMENTE_DEVUELTA' ? (
                    <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>DEVOLUCION PARCIAL</span>
                  ) : (
                    venta.estadoPago === 'PAGADO' ? (
                      <span className="badge badge-primary">PAGADO</span>
                    ) : (
                      <>
                        <span className="badge badge-warning" style={{ background: '#f59e0b', color: 'white' }}>PENDIENTE</span>
                        {venta.montoPagado > 0 && (
                          <span className="badge" style={{ background: 'var(--surface-hover)', color: 'var(--text-primary)' }}>
                            Pagado: {formatCurrency(venta.montoPagado)}
                          </span>
                        )}
                      </>
                    )
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, fontSize: '1.125rem', color: venta.estadoVenta === 'DEVUELTA' ? 'var(--text-secondary)' : 'var(--success)', textDecoration: venta.estadoVenta === 'DEVUELTA' ? 'line-through' : 'none' }}>
                  {formatCurrency(venta.total)}
                </div>
                {venta.estadoVenta !== 'DEVUELTA' && venta.estadoPago === 'PENDIENTE' && (
                  <div style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: '4px', fontWeight: 500 }}>
                    Debe: {formatCurrency(venta.total - (venta.montoPagado || 0))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {venta.detalles.map((det) => (
                <div key={det.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span>{det.cantidad}x {det.producto?.nombre || 'Producto eliminado'}</span>
                  <span>{formatCurrency(det.precioUnitario * det.cantidad)}</span>
                </div>
              ))}
            </div>
            
            {venta.notas && (
              <div style={{ marginTop: '12px', padding: '8px 12px', background: 'var(--background)', borderRadius: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>Notas:</strong> {venta.notas}
              </div>
            )}

            {venta.estadoVenta !== 'DEVUELTA' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                {venta.estadoPago === 'PENDIENTE' && (
                  <>
                    <button onClick={() => handlePartialPayment(venta)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.875rem' }} title="Pagar una parte a cuenta">
                      <Wallet size={16} /> Abonar a cuenta
                    </button>
                    <button onClick={() => handleMarkAsPaid(venta.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.875rem' }} title="Liquidar pago completo">
                      <CheckCircle size={16} /> Liquidar (Pagar Todo)
                    </button>
                  </>
                )}
                <button onClick={() => handleReturn(venta)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.875rem', opacity: 0.8 }} title="Devolver venta (stock devuelto)">
                  <RotateCcw size={16} /> Devolver
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
