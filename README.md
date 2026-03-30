# Gestor-Proyectos-Entidad

Aplicacion local para gestion de proyectos, contactos, compras, ventas y copias de seguridad.

## Requisitos

- Node.js 18+
- npm 9+

## Configuracion inicial

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno local:

```bash
cp .env.example .env.local
```

3. Configura variables:

- `DATABASE_URL`: ruta de SQLite (recomendado: `file:./dev.db`, relativa a `prisma/schema.prisma`).
- `LOCAL_ADMIN_TOKEN`: token para endpoints sensibles (`/api/backup/*`) y para apagar el servidor cuando no se accede por `localhost`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: opcionales para enviar correos automaticos por cada movimiento de venta.

Si no configuras SMTP, la app sigue funcionando pero no enviara emails.

## Desarrollo

```bash
npm run dev
```

La app abre en `http://localhost:3000`.

## Base de datos

Aplicar migraciones de forma segura:

```bash
npx prisma migrate deploy
```

Generar cliente Prisma:

```bash
npx prisma generate
```

## Arranque en modo app local (macOS)

Puedes usar el script:

```bash
./iniciar-gestor.command
```

Este script:

- instala dependencias (si faltan),
- aplica migraciones con `prisma migrate deploy`,
- levanta el servidor en puerto 3000,
- abre la app en modo ventana de Chrome.

## Calidad

```bash
npm run lint
npx tsc --noEmit
```
