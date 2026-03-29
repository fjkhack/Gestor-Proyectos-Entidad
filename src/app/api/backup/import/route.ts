import { NextResponse } from "next/server";
import { rename, writeFile } from "fs/promises";
import { join } from "path";
import { guardLocalAdminRequest } from "@/lib/security";

export async function POST(request: Request) {
  const guardResponse = guardLocalAdminRequest(request, {
    featureName: "Backup import",
  });
  if (guardResponse) return guardResponse;

  try {
    const MAX_BACKUP_SIZE_BYTES = 25 * 1024 * 1024;

    const formData = await request.formData();
    const file = formData.get("dbBackup");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se encontró el archivo." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".db")) {
      return NextResponse.json(
        { error: "Archivo no válido. Debe ser .db" },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "El archivo está vacío." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BACKUP_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera el tamaño máximo permitido (25MB)." },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const sqliteHeader = Buffer.from("SQLite format 3\u0000", "utf-8");
    const hasValidSqliteHeader =
      buffer.length > sqliteHeader.length &&
      buffer.subarray(0, sqliteHeader.length).equals(sqliteHeader);

    if (!hasValidSqliteHeader) {
      return NextResponse.json(
        { error: "El archivo no parece ser una base de datos SQLite válida." },
        { status: 400 }
      );
    }

    const dbPath = join(process.cwd(), "prisma", "dev.db");
    const tmpDbPath = join(process.cwd(), "prisma", "dev.db.uploading");

    await writeFile(tmpDbPath, buffer);
    await rename(tmpDbPath, dbPath);

    return NextResponse.json({ success: true, message: "Base de datos reemplazada" });
  } catch (error) {
    console.error("Error importing DB backup:", error);
    return NextResponse.json(
      { error: "Error interno al importar la base de datos." },
      { status: 500 }
    );
  }
}
