import { NextResponse } from "next/server"
import { guardLocalAdminRequest } from "@/lib/security"

export async function POST(request: Request) {
  const guardResponse = guardLocalAdminRequest(request, {
    featureName: "Server shutdown",
  })
  if (guardResponse) return guardResponse

  console.log("Shutting down the server by user request...")

  setTimeout(() => {
    process.exit(0)
  }, 300)

  return NextResponse.json({ success: true, message: "Server shutting down..." })
}
