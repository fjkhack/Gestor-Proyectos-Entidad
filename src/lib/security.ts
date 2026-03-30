import { NextResponse } from "next/server"

type GuardOptions = {
  featureName: string
  allowLoopbackWithoutToken?: boolean
}

function isLoopbackRequest(request: Request): boolean {
  const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"])

  try {
    const url = new URL(request.url)
    if (loopbackHosts.has(url.hostname)) return true
  } catch {
    // Ignore malformed URL and keep evaluating headers.
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (forwardedFor && loopbackHosts.has(forwardedFor)) return true

  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp && loopbackHosts.has(realIp)) return true

  return false
}

export function guardLocalAdminRequest(request: Request, options: GuardOptions): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        code: "DISABLED_IN_PRODUCTION",
        message: `${options.featureName} is disabled in production.`,
      },
      { status: 403 }
    )
  }

  if (options.allowLoopbackWithoutToken && isLoopbackRequest(request)) {
    return null
  }

  const expectedToken = process.env.LOCAL_ADMIN_TOKEN?.trim()
  if (!expectedToken) {
    return NextResponse.json(
      {
        success: false,
        code: "LOCAL_ADMIN_TOKEN_NOT_CONFIGURED",
        message: "LOCAL_ADMIN_TOKEN is not configured in this environment.",
      },
      { status: 500 }
    )
  }

  const providedToken = request.headers.get("x-admin-token")?.trim()
  if (!providedToken) {
    return NextResponse.json(
      {
        success: false,
        code: "MISSING_ADMIN_TOKEN",
        message: "Missing x-admin-token header.",
      },
      { status: 401 }
    )
  }

  if (providedToken !== expectedToken) {
    return NextResponse.json(
      {
        success: false,
        code: "INVALID_ADMIN_TOKEN",
        message: "Invalid admin token.",
      },
      { status: 403 }
    )
  }

  return null
}
