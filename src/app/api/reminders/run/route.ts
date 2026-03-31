import { NextResponse } from "next/server"
import { guardLocalAdminRequest } from "@/lib/security"
import { runTaskReminders } from "@/lib/task-reminders"

export async function POST(request: Request) {
  const guardResponse = guardLocalAdminRequest(request, {
    featureName: "Task reminders",
    allowLoopbackWithoutToken: true,
  })
  if (guardResponse) return guardResponse

  try {
    const body = (await request.json().catch(() => ({}))) as { force?: boolean }
    const result = await runTaskReminders({ force: Boolean(body.force) })
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error running reminders:", error)
    return NextResponse.json(
      { success: false, message: "No se pudieron ejecutar los recordatorios" },
      { status: 500 }
    )
  }
}
