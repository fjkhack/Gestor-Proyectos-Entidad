import { randomUUID } from "crypto"
import nodemailer from "nodemailer"
import { addDays, endOfDay, startOfDay } from "date-fns"
import { prisma } from "@/lib/prisma"

type ReminderType = "OVERDUE" | "TODAY" | "TOMORROW"

type ReminderCandidate = {
  actionId: string
  projectId: string
  projectTitle: string
  taskTitle: string
  taskDate: Date
  participantName: string | null
  participantEmail: string | null
  reminderType: ReminderType
  reminderDate: Date
}

type RunTaskRemindersInput = {
  force?: boolean
}

export type RunTaskRemindersResult = {
  success: boolean
  skipped?: string
  summary?: {
    overdue: number
    today: number
    tomorrow: number
    remindersSent: number
    recipients: number
  }
}

function parseBoolEnv(value: string | undefined): boolean {
  if (!value) return false
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
}

function parseSmtpPort(): number {
  const port = Number(process.env.SMTP_PORT || "587")
  return Number.isFinite(port) ? port : 587
}

function sanitizeEmail(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (!/^\S+@\S+\.\S+$/.test(trimmed)) return null
  return trimmed
}

function parseReminderRecipients(value: string | undefined): string[] {
  if (!value) return []
  const recipients = value
    .split(",")
    .map((item) => sanitizeEmail(item))
    .filter((item): item is string => Boolean(item))
  return Array.from(new Set(recipients))
}

function formatTaskDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
  }).format(date)
}

function buildSubject(overdue: number, today: number, tomorrow: number): string {
  const parts = []
  if (overdue > 0) parts.push(`${overdue} vencidas`)
  if (today > 0) parts.push(`${today} para hoy`)
  if (tomorrow > 0) parts.push(`${tomorrow} para manana`)
  return `[Gestor] Recordatorios de tareas: ${parts.join(" · ")}`
}

function bucketTitle(type: ReminderType): string {
  if (type === "OVERDUE") return "Tareas vencidas"
  if (type === "TODAY") return "Tareas para hoy"
  return "Tareas para manana"
}

function buildTextBody(grouped: Record<ReminderType, ReminderCandidate[]>): string {
  const lines: string[] = [
    "RECORDATORIO DIARIO DE TAREAS",
    "---------------------------",
    `Generado: ${new Date().toLocaleString("es-ES")}`,
    "",
  ]

  ;(["OVERDUE", "TODAY", "TOMORROW"] as ReminderType[]).forEach((type) => {
    const tasks = grouped[type]
    if (!tasks.length) return

    lines.push(bucketTitle(type))
    tasks.forEach((task) => {
      const assignee = task.participantName ? ` · Asignada a: ${task.participantName}` : ""
      lines.push(`- ${task.taskTitle} (${task.projectTitle}) · Fecha: ${formatTaskDate(task.taskDate)}${assignee}`)
    })
    lines.push("")
  })

  lines.push("Este mensaje se envia automaticamente desde Gestor-Proyectos-Entidad.")
  return lines.join("\n")
}

function buildHtmlBody(grouped: Record<ReminderType, ReminderCandidate[]>): string {
  const section = (type: ReminderType) => {
    const tasks = grouped[type]
    if (!tasks.length) return ""

    return `
      <div style="margin:16px 0;">
        <h3 style="margin:0 0 8px 0;font-size:16px;color:#0f172a;">${bucketTitle(type)}</h3>
        <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          ${tasks
            .map(
              (task) => `
              <div style="padding:10px 12px;border-top:1px solid #e2e8f0;">
                <div style="font-weight:600;color:#0f172a;">${task.taskTitle}</div>
                <div style="font-size:13px;color:#475569;margin-top:3px;">Proyecto: ${task.projectTitle}</div>
                <div style="font-size:13px;color:#475569;">Fecha: ${formatTaskDate(task.taskDate)}</div>
                ${task.participantName ? `<div style="font-size:13px;color:#475569;">Asignada a: ${task.participantName}</div>` : ""}
              </div>
            `
            )
            .join("")}
        </div>
      </div>
    `
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:18px;color:#0f172a;">
      <h2 style="margin:0 0 8px 0;">Recordatorio diario de tareas</h2>
      <p style="margin:0 0 12px 0;color:#64748b;">Generado: ${new Date().toLocaleString("es-ES")}</p>
      ${section("OVERDUE")}
      ${section("TODAY")}
      ${section("TOMORROW")}
      <p style="margin-top:14px;color:#64748b;font-size:12px;">Este mensaje se envia automaticamente desde Gestor-Proyectos-Entidad.</p>
    </div>
  `
}

function getReminderWindow(now: Date) {
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const tomorrowStart = startOfDay(addDays(now, 1))
  const tomorrowEnd = endOfDay(addDays(now, 1))
  return { todayStart, todayEnd, tomorrowStart, tomorrowEnd }
}

function classifyReminder(date: Date, now: Date): { type: ReminderType; reminderDate: Date } | null {
  const { todayStart, todayEnd, tomorrowStart, tomorrowEnd } = getReminderWindow(now)

  if (date < todayStart) {
    return { type: "OVERDUE", reminderDate: todayStart }
  }

  if (date >= todayStart && date <= todayEnd) {
    return { type: "TODAY", reminderDate: todayStart }
  }

  if (date >= tomorrowStart && date <= tomorrowEnd) {
    return { type: "TOMORROW", reminderDate: tomorrowStart }
  }

  return null
}

export async function runTaskReminders(input: RunTaskRemindersInput = {}): Promise<RunTaskRemindersResult> {
  if (!parseBoolEnv(process.env.REMINDER_ENABLED)) {
    return { success: true, skipped: "REMINDER_ENABLED desactivado" }
  }

  const now = new Date()
  const reminderHour = Number(process.env.REMINDER_HOUR ?? "")
  const hasValidHour = Number.isInteger(reminderHour) && reminderHour >= 0 && reminderHour <= 23
  if (!input.force && hasValidHour && now.getHours() !== reminderHour) {
    return { success: true, skipped: `Hora fuera de ventana configurada (${reminderHour}:00)` }
  }

  const pendingActions = await prisma.action.findMany({
    where: {
      completed: false,
      date: { not: null },
    },
    include: {
      project: true,
      participant: true,
    },
  })

  const candidates: ReminderCandidate[] = pendingActions
    .map((action) => {
      if (!action.date) return null
      const classified = classifyReminder(action.date, now)
      if (!classified) return null

      return {
        actionId: action.id,
        projectId: action.projectId,
        projectTitle: action.project.title,
        taskTitle: action.title,
        taskDate: action.date,
        participantName: action.participant?.name ?? null,
        participantEmail: action.participant?.email ?? null,
        reminderType: classified.type,
        reminderDate: classified.reminderDate,
      }
    })
    .filter((item): item is ReminderCandidate => Boolean(item))

  if (candidates.length === 0) {
    return {
      success: true,
      summary: { overdue: 0, today: 0, tomorrow: 0, remindersSent: 0, recipients: 0 },
      skipped: "No hay tareas para recordar",
    }
  }

  const actionIds = Array.from(new Set(candidates.map((item) => item.actionId)))
  const { todayStart, tomorrowStart } = getReminderWindow(now)

  const existingLogs = await prisma.reminderLog.findMany({
    where: {
      actionId: { in: actionIds },
      OR: [
        { reminderType: "OVERDUE", reminderDate: todayStart },
        { reminderType: "TODAY", reminderDate: todayStart },
        { reminderType: "TOMORROW", reminderDate: tomorrowStart },
      ],
    },
    select: {
      actionId: true,
      reminderType: true,
      reminderDate: true,
    },
  })

  const sentKeys = new Set(existingLogs.map((log) => `${log.actionId}:${log.reminderType}:${log.reminderDate.toISOString()}`))
  const unsent = candidates.filter((item) => !sentKeys.has(`${item.actionId}:${item.reminderType}:${item.reminderDate.toISOString()}`))

  if (unsent.length === 0) {
    return {
      success: true,
      summary: { overdue: 0, today: 0, tomorrow: 0, remindersSent: 0, recipients: 0 },
      skipped: "No hay recordatorios nuevos",
    }
  }

  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM || smtpUser

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    return { success: false, skipped: "SMTP no configurado" }
  }

  const envRecipients = parseReminderRecipients(process.env.REMINDER_TO)
  const participantRecipients = Array.from(
    new Set(unsent.map((item) => sanitizeEmail(item.participantEmail)).filter((email): email is string => Boolean(email)))
  )
  const recipients = Array.from(new Set([...envRecipients, ...participantRecipients]))

  if (recipients.length === 0) {
    return { success: false, skipped: "No hay destinatarios validos en REMINDER_TO ni en participantes asignados" }
  }

  const grouped: Record<ReminderType, ReminderCandidate[]> = {
    OVERDUE: unsent.filter((item) => item.reminderType === "OVERDUE"),
    TODAY: unsent.filter((item) => item.reminderType === "TODAY"),
    TOMORROW: unsent.filter((item) => item.reminderType === "TOMORROW"),
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseSmtpPort(),
    secure: parseSmtpPort() === 465,
    auth: { user: smtpUser, pass: smtpPass },
  })

  await transporter.sendMail({
    from: smtpFrom,
    to: recipients.join(", "),
    subject: buildSubject(grouped.OVERDUE.length, grouped.TODAY.length, grouped.TOMORROW.length),
    text: buildTextBody(grouped),
    html: buildHtmlBody(grouped),
  })

  await prisma.$transaction(
    unsent.map((item) =>
      prisma.reminderLog.upsert({
        where: {
          actionId_reminderType_reminderDate: {
            actionId: item.actionId,
            reminderType: item.reminderType,
            reminderDate: item.reminderDate,
          },
        },
        create: {
          id: randomUUID(),
          actionId: item.actionId,
          reminderType: item.reminderType,
          reminderDate: item.reminderDate,
        },
        update: {},
      })
    )
  )

  return {
    success: true,
    summary: {
      overdue: grouped.OVERDUE.length,
      today: grouped.TODAY.length,
      tomorrow: grouped.TOMORROW.length,
      remindersSent: unsent.length,
      recipients: recipients.length,
    },
  }
}
