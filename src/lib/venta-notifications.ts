import nodemailer from 'nodemailer'

type NotifyVentaMovementInput = {
  movementTitle: string
  movementDescription: string
  ventaId: string
  contactName: string
  contactEmail?: string | null
  copyEmail?: string | null
  total: number
  montoPagado: number
  deuda: number
  amountChanged?: number
  refundAmount?: number
  actionRequired?: string
  lineItems?: Array<{
    nombre: string
    cantidad: number
    importe: number
  }>
}

function parseSmtpPort(): number {
  const port = Number(process.env.SMTP_PORT || '587')
  return Number.isFinite(port) ? port : 587
}

function sanitizeEmail(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (!/^\S+@\S+\.\S+$/.test(trimmed)) return null
  return trimmed
}

function formatMoney(value: number): string {
  return `${value.toFixed(2)} EUR`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildSubject(input: NotifyVentaMovementInput): string {
  const prefix = input.refundAmount && input.refundAmount > 0 ? '[ALERTA]' : '[Gestor Ventas]'
  return `${prefix} ${input.movementTitle} · Pedido ${input.ventaId.slice(0, 8)}`
}

function buildTextBody(input: NotifyVentaMovementInput): string {
  const now = new Date().toLocaleString('es-ES')
  const lineItemsText = input.lineItems && input.lineItems.length > 0
    ? [
        '',
        'Detalle de lineas afectadas:',
        ...input.lineItems.map((item) => `- ${item.nombre} · Cantidad: ${item.cantidad} · Importe: ${formatMoney(item.importe)}`),
      ]
    : []

  return [
    'NOTIFICACION DE MOVIMIENTO DE VENTA',
    '-----------------------------------',
    `Fecha: ${now}`,
    `Movimiento: ${input.movementTitle}`,
    `Descripcion: ${input.movementDescription}`,
    input.actionRequired ? `ACCION REQUERIDA: ${input.actionRequired}` : null,
    '',
    `Pedido (ID): ${input.ventaId}`,
    `Cliente: ${input.contactName}`,
    input.amountChanged !== undefined ? `Importe del movimiento: ${formatMoney(input.amountChanged)}` : null,
    input.refundAmount !== undefined ? `Importe a devolver al cliente: ${formatMoney(input.refundAmount)}` : null,
    ...lineItemsText,
    '',
    'Estado financiero actual del pedido:',
    `- Total actual: ${formatMoney(input.total)}`,
    `- Pagado acumulado: ${formatMoney(input.montoPagado)}`,
    `- Pendiente (deuda): ${formatMoney(input.deuda)}`,
    '',
    'Este correo se envia automaticamente desde Gestor-Proyectos-Entidad.',
    'Conservalo para trazabilidad y resolucion de incidencias.',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildHtmlBody(input: NotifyVentaMovementInput): string {
  const now = new Date().toLocaleString('es-ES')
  const actionBlock = input.actionRequired
    ? `<div style="margin:14px 0;padding:12px 14px;border-radius:10px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;"><strong>Accion requerida:</strong> ${escapeHtml(input.actionRequired)}</div>`
    : ''

  const lineItemsBlock = input.lineItems && input.lineItems.length > 0
    ? `
      <div style="margin-top:12px;">
        <div style="font-weight:600;color:#0f172a;margin-bottom:8px;">Detalle de lineas afectadas</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;color:#334155;">
              <th style="text-align:left;padding:8px;border:1px solid #e2e8f0;">Producto</th>
              <th style="text-align:right;padding:8px;border:1px solid #e2e8f0;">Cantidad</th>
              <th style="text-align:right;padding:8px;border:1px solid #e2e8f0;">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${input.lineItems
              .map(
                (item) => `
                  <tr>
                    <td style="padding:8px;border:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(item.nombre)}</td>
                    <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;color:#0f172a;">${item.cantidad}</td>
                    <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;color:#0f172a;">${escapeHtml(formatMoney(item.importe))}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    : ''

  return `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:18px;color:#0f172a;">
      <h2 style="margin:0 0 6px 0;">Notificacion de movimiento de venta</h2>
      <div style="font-size:13px;color:#64748b;margin-bottom:14px;">${escapeHtml(now)}</div>

      <div style="padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
        <div style="font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(input.movementTitle)}</div>
        <div style="margin-top:6px;color:#334155;line-height:1.45;">${escapeHtml(input.movementDescription)}</div>
        ${actionBlock}
      </div>

      <div style="margin-top:14px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div><strong>Pedido (ID):</strong> ${escapeHtml(input.ventaId)}</div>
        <div style="margin-top:4px;"><strong>Cliente:</strong> ${escapeHtml(input.contactName)}</div>
        ${input.amountChanged !== undefined ? `<div style="margin-top:4px;"><strong>Importe del movimiento:</strong> ${escapeHtml(formatMoney(input.amountChanged))}</div>` : ''}
        ${input.refundAmount !== undefined ? `<div style="margin-top:4px;"><strong>Importe a devolver al cliente:</strong> ${escapeHtml(formatMoney(input.refundAmount))}</div>` : ''}
        ${lineItemsBlock}
      </div>

      <div style="margin-top:14px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="font-weight:700;margin-bottom:8px;">Estado financiero actual del pedido</div>
        <div>Total actual: <strong>${escapeHtml(formatMoney(input.total))}</strong></div>
        <div style="margin-top:4px;">Pagado acumulado: <strong>${escapeHtml(formatMoney(input.montoPagado))}</strong></div>
        <div style="margin-top:4px;">Pendiente (deuda): <strong>${escapeHtml(formatMoney(input.deuda))}</strong></div>
      </div>

      <div style="margin-top:16px;font-size:12px;color:#64748b;">
        Este correo se envia automaticamente desde Gestor-Proyectos-Entidad.<br/>
        Conservalo para trazabilidad y resolucion de incidencias.
      </div>
    </div>
  `
}

export async function notifyVentaMovement(input: NotifyVentaMovementInput): Promise<void> {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user

  if (!host || !user || !pass || !from) return

  const to = sanitizeEmail(input.contactEmail)
  const cc = sanitizeEmail(input.copyEmail)
  if (!to && !cc) return

  const transporter = nodemailer.createTransport({
    host,
    port: parseSmtpPort(),
    secure: parseSmtpPort() === 465,
    auth: { user, pass },
  })

  const subject = buildSubject(input)
  const text = buildTextBody(input)
  const html = buildHtmlBody(input)

  await transporter.sendMail({
    from,
    to: to || undefined,
    cc: cc || undefined,
    subject,
    text,
    html,
  })
}
