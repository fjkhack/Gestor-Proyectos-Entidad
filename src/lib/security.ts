import { NextResponse } from "next/server"

type GuardOptions = {
  featureName: string
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
