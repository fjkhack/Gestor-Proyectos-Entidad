-- CreateTable
CREATE TABLE "VentaMovimiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ventaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "monto" REAL,
    "total" REAL NOT NULL,
    "montoPagado" REAL NOT NULL,
    "deuda" REAL NOT NULL,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VentaMovimiento_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VentaMovimiento_ventaId_createdAt_idx" ON "VentaMovimiento"("ventaId", "createdAt");
