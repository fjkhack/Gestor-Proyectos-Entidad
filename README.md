# Gestor-Proyectos-Entidad

Aplicacion local para gestion de proyectos, contactos, compras, ventas y copias de seguridad.

Guia paso a paso para Mac nuevo (M4): `MANUAL_INSTALACION_MAC_M4.md`

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
- `REMINDER_ENABLED`, `REMINDER_TO`, `REMINDER_HOUR`: opcionales para activar recordatorios diarios de tareas pendientes (vencidas, hoy y manana).

Si no configuras SMTP, la app sigue funcionando pero no enviara emails.

## Recordatorios de tareas

El sistema puede enviar un resumen diario por email de tareas pendientes:

- Vencidas
- Con vencimiento hoy
- Con vencimiento manana

Variables recomendadas:

```bash
REMINDER_ENABLED="true"
REMINDER_TO="admin@tu-dominio.com"
REMINDER_HOUR="9"
```

Ejecucion manual:

```bash
npm run reminders:run
```

Forzar envio (ignora la hora configurada):

```bash
npm run reminders:run -- --force
```

## Programar recordatorios automaticos en macOS (launchd)

Instalar o actualizar la tarea diaria (usa `REMINDER_HOUR` de `.env.local`):

```bash
chmod +x scripts/setup-reminders-launchd.sh
./scripts/setup-reminders-launchd.sh
```

Comandos utiles:

```bash
# Estado del job
launchctl print gui/$(id -u)/com.gestorproyectos.reminders

# Ejecutar ahora (prueba manual)
launchctl kickstart -k gui/$(id -u)/com.gestorproyectos.reminders

# Desinstalar job
launchctl bootout gui/$(id -u)/com.gestorproyectos.reminders
rm ~/Library/LaunchAgents/com.gestorproyectos.reminders.plist
```

Logs:

- `/tmp/gestor-reminders.out.log`
- `/tmp/gestor-reminders.err.log`

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
