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

  const subject = `[Gestor] ${input.movementTitle} · Venta ${input.ventaId.slice(0, 8)}`
  const body = [
    `Movimiento: ${input.movementTitle}`,
    `Descripcion: ${input.movementDescription}`,
    `Venta ID: ${input.ventaId}`,
    `Cliente: ${input.contactName}`,
    input.amountChanged !== undefined ? `Importe del movimiento: ${formatMoney(input.amountChanged)}` : null,
    input.refundAmount !== undefined ? `Importe a devolver al cliente: ${formatMoney(input.refundAmount)}` : null,
    `Total actual de la venta: ${formatMoney(input.total)}`,
    `Pagado acumulado: ${formatMoney(input.montoPagado)}`,
    `Pendiente (deuda): ${formatMoney(input.deuda)}`,
    '',
    'Este correo se envia automaticamente desde el Gestor-Proyectos-Entidad.',
  ]
    .filter(Boolean)
    .join('\n')

  await transporter.sendMail({
    from,
    to: to || undefined,
    cc: cc || undefined,
    subject,
    text: body,
  })
}
