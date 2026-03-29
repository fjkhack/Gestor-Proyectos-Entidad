/**
 * migrate-dev2.ts
 * ---------------
 * Importa los datos del programa de ventas antiguo (dev2.db) al proyecto actual (dev.db).
 *
 * Uso:
 *   1. Exporta los datos de dev2.db a JSON (ya hecho si sigues el README):
 *      sqlite3 prisma/dev2.db -json "SELECT * FROM Categoria"     > /tmp/dev2_categorias.json
 *      sqlite3 prisma/dev2.db -json "SELECT * FROM Cliente"       > /tmp/dev2_clientes.json
 *      sqlite3 prisma/dev2.db -json "SELECT * FROM Producto"      > /tmp/dev2_productos.json
 *      sqlite3 prisma/dev2.db -json "SELECT * FROM Compra"        > /tmp/dev2_compras.json
 *      sqlite3 prisma/dev2.db -json "SELECT * FROM Venta"         > /tmp/dev2_ventas.json
 *      sqlite3 prisma/dev2.db -json "SELECT * FROM DetalleCompra" > /tmp/dev2_detalle_compra.json
 *      sqlite3 prisma/dev2.db -json "SELECT * FROM DetalleVenta"  > /tmp/dev2_detalle_venta.json
 *
 *   2. Ejecuta este script:
 *      npx tsx scripts/migrate-dev2.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// ── Tipos del esquema antiguo (dev2.db) ──────────────────────────────────────

interface OldCategoria {
  id: number
  nombre: string
  createdAt: string
}

interface OldCliente {
  id: number
  nombre: string
  email: string | null
  telefono: string | null
  direccion: string | null
  createdAt: string
}

interface OldProducto {
  id: number
  nombre: string
  categoriaId: number
  precioVenta: number
  precioCompra: number
  stockActual: number
  imagen: string | null
  createdAt: string
}

interface OldCompra {
  id: number
  fecha: string
  proveedor: string
  notas: string | null
  total: number
}

interface OldVenta {
  id: number
  fecha: string
  clienteId: number
  notas: string | null
  total: number
  estadoPago: string
  montoPagado: number
  estadoVenta: string
}

interface OldDetalleCompra {
  id: number
  compraId: number
  productoId: number
  cantidad: number
  precioUnitario: number
}

interface OldDetalleVenta {
  id: number
  ventaId: number
  productoId: number
  cantidad: number
  precioUnitario: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const JSON_DIR = '/tmp'

function readJson<T>(filename: string): T[] {
  const filePath = path.join(JSON_DIR, filename)
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Archivo no encontrado: ${filePath}. Se asume vacío.`)
    return []
  }
  const raw = fs.readFileSync(filePath, 'utf-8').trim()
  if (!raw || raw === '') return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.warn(`⚠️  No se pudo parsear ${filename}. Se asume vacío.`)
    return []
  }
}

function cleanPhone(tel: string | null): string | null {
  if (!tel) return null
  // Elimina espacios y caracteres extraños (p.ej. caracteres unicode raros)
  return tel.replace(/[^\d+\-\s]/g, '').trim() || null
}

// ── Migración principal ───────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Iniciando migración de dev2.db → dev.db\n')

  // Mapas: id_antiguo → id_nuevo (UUID)
  const categoriaMap = new Map<number, string>()
  const clienteMap = new Map<number, string>()   // Cliente → Contact
  const productoMap = new Map<number, string>()
  const compraMap = new Map<number, string>()
  const ventaMap = new Map<number, string>()

  // ── 1. CATEGORÍAS ──────────────────────────────────────────────────────────
  const categorias = readJson<OldCategoria>('dev2_categorias.json')
  console.log(`📦 Importando ${categorias.length} categorías...`)

  for (const cat of categorias) {
    // Busca si ya existe por nombre (evita duplicados)
    let existing = await prisma.categoria.findUnique({ where: { nombre: cat.nombre } })
    if (!existing) {
      existing = await prisma.categoria.create({
        data: { nombre: cat.nombre },
      })
      console.log(`  ✅ Categoría creada: "${cat.nombre}" → ${existing.id}`)
    } else {
      console.log(`  ♻️  Categoría ya existe: "${cat.nombre}" → ${existing.id}`)
    }
    categoriaMap.set(cat.id, existing.id)
  }

  // ── 2. CLIENTES → CONTACTOS ────────────────────────────────────────────────
  const clientes = readJson<OldCliente>('dev2_clientes.json')
  console.log(`\n👥 Importando ${clientes.length} clientes como Contactos...`)

  for (const cli of clientes) {
    const phone = cleanPhone(cli.telefono)
    // Busca por nombre exacto para evitar duplicados
    let existing = await prisma.contact.findFirst({ where: { name: cli.nombre } })
    if (!existing) {
      existing = await prisma.contact.create({
        data: {
          name: cli.nombre,
          email: cli.email ?? null,
          phone: phone,
          type: 'PERSONA',
          notes: cli.direccion ? `Dirección: ${cli.direccion}` : null,
        },
      })
      console.log(`  ✅ Contacto creado: "${cli.nombre}" → ${existing.id}`)
    } else {
      console.log(`  ♻️  Contacto ya existe: "${cli.nombre}" → ${existing.id}`)
    }
    clienteMap.set(cli.id, existing.id)
  }

  // ── 3. PRODUCTOS ───────────────────────────────────────────────────────────
  const productos = readJson<OldProducto>('dev2_productos.json')
  console.log(`\n🛍️  Importando ${productos.length} productos...`)

  for (const prod of productos) {
    const nuevaCategoriaId = categoriaMap.get(prod.categoriaId)
    if (!nuevaCategoriaId) {
      console.warn(`  ⚠️  Producto "${prod.nombre}" tiene categoriaId=${prod.categoriaId} sin mapear. Saltando.`)
      continue
    }

    // Evita duplicados por nombre exacto
    let existing = await prisma.producto.findFirst({ where: { nombre: prod.nombre } })
    if (!existing) {
      existing = await prisma.producto.create({
        data: {
          nombre: prod.nombre,
          categoriaId: nuevaCategoriaId,
          precioVenta: prod.precioVenta,
          precioCompra: prod.precioCompra,
          stockActual: prod.stockActual,
          imagen: prod.imagen ?? null,
        },
      })
      console.log(`  ✅ Producto creado: "${prod.nombre}" (stock: ${prod.stockActual})`)
    } else {
      console.log(`  ♻️  Producto ya existe: "${prod.nombre}" → ${existing.id}`)
    }
    productoMap.set(prod.id, existing.id)
  }

  // ── 4. COMPRAS ─────────────────────────────────────────────────────────────
  const compras = readJson<OldCompra>('dev2_compras.json')
  const detallesCompra = readJson<OldDetalleCompra>('dev2_detalle_compra.json')
  console.log(`\n🛒 Importando ${compras.length} compras...`)

  for (const compra of compras) {
    // En dev2.db el proveedor es texto libre → buscar/crear como Contact de tipo ENTIDAD
    let proveedorContact = await prisma.contact.findFirst({
      where: { name: compra.proveedor },
    })
    if (!proveedorContact) {
      proveedorContact = await prisma.contact.create({
        data: {
          name: compra.proveedor,
          type: 'ENTIDAD',
          notes: 'Importado desde programa de ventas anterior',
        },
      })
      console.log(`  🏢 Proveedor creado como contacto: "${compra.proveedor}"`)
    }

    const nuevaCompra = await prisma.compra.create({
      data: {
        fecha: new Date(compra.fecha),
        contactId: proveedorContact.id,
        notas: compra.notas ?? null,
        total: compra.total,
        detalles: {
          create: detallesCompra
            .filter((d) => d.compraId === compra.id)
            .map((d) => {
              const newProductoId = productoMap.get(d.productoId)
              if (!newProductoId) {
                console.warn(`    ⚠️  DetalleCompra: productoId=${d.productoId} sin mapear.`)
                return null
              }
              return {
                productoId: newProductoId,
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
              }
            })
            .filter((d): d is NonNullable<typeof d> => d !== null),
        },
      },
    })
    compraMap.set(compra.id, nuevaCompra.id)
    console.log(`  ✅ Compra importada: ${nuevaCompra.id} (total: ${compra.total}€)`)
  }

  // ── 5. VENTAS ──────────────────────────────────────────────────────────────
  const ventas = readJson<OldVenta>('dev2_ventas.json')
  const detallesVenta = readJson<OldDetalleVenta>('dev2_detalle_venta.json')
  console.log(`\n💰 Importando ${ventas.length} ventas...`)

  for (const venta of ventas) {
    const nuevaClienteId = clienteMap.get(venta.clienteId)
    if (!nuevaClienteId) {
      console.warn(`  ⚠️  Venta id=${venta.id} tiene clienteId=${venta.clienteId} sin mapear. Saltando.`)
      continue
    }

    const nuevaVenta = await prisma.venta.create({
      data: {
        fecha: new Date(venta.fecha),
        contactId: nuevaClienteId,
        notas: venta.notas ?? null,
        total: venta.total,
        estadoPago: venta.estadoPago,
        montoPagado: venta.montoPagado,
        estadoVenta: venta.estadoVenta,
        detalles: {
          create: detallesVenta
            .filter((d) => d.ventaId === venta.id)
            .map((d) => {
              const newProductoId = productoMap.get(d.productoId)
              if (!newProductoId) {
                console.warn(`    ⚠️  DetalleVenta: productoId=${d.productoId} sin mapear.`)
                return null
              }
              return {
                productoId: newProductoId,
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
              }
            })
            .filter((d): d is NonNullable<typeof d> => d !== null),
        },
      },
    })
    ventaMap.set(venta.id, nuevaVenta.id)
    console.log(`  ✅ Venta importada: ${nuevaVenta.id} (total: ${venta.total}€)`)
  }

  // ── Resumen ────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────')
  console.log('✅ Migración completada:')
  console.log(`   Categorías : ${categoriaMap.size}`)
  console.log(`   Contactos  : ${clienteMap.size}`)
  console.log(`   Productos  : ${productoMap.size}`)
  console.log(`   Compras    : ${compraMap.size}`)
  console.log(`   Ventas     : ${ventaMap.size}`)
  console.log('─────────────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error('❌ Error en la migración:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
