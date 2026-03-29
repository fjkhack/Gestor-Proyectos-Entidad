import { NextResponse } from "next/server";
import { readFileSync, statSync } from "fs";
import { join } from "path";
import { guardLocalAdminRequest } from "@/lib/security";

export async function GET(request: Request) {
  const guardResponse = guardLocalAdminRequest(request, {
    featureName: "Backup export",
  });
  if (guardResponse) return guardResponse;

  try {
    const dbPath = join(process.cwd(), "prisma", "dev.db");
    const stat = statSync(dbPath);
    const fileBuffer = readFileSync(dbPath);

    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `backup_gestor_${date}.db`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/octet-stream",
        "Content-Length": stat.size.toString(),
      },
    });
  } catch (error) {
    console.error("Error exporting DB backup:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo exportar la base de datos." },
      { status: 500 }
    );
  }
}
