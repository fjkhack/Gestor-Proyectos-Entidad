# Manual de instalacion en Mac nuevo (chip M4)

Este manual instala el proyecto por primera vez en un Mac con Apple Silicon (M4), desde cero.

Si quieres hacerlo en un solo paso, usa el script automatizado:

```bash
chmod +x scripts/bootstrap-mac-m4.sh
./scripts/bootstrap-mac-m4.sh
```

## 1) Preparar el Mac

```bash
# Herramientas de compilacion de Apple
xcode-select --install

# Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cargar Homebrew en la shell actual
eval "$(/opt/homebrew/bin/brew shellenv)"

# Instalar Git y Node.js LTS
brew install git node

# Verificar
git --version
node -v
npm -v
```

## 2) Descargar el proyecto

```bash
cd ~/Documents
git clone https://github.com/fjkhack/Gestor-Proyectos-Entidad.git
cd Gestor-Proyectos-Entidad

# Rama recomendada
git checkout main
```

## 3) Configurar entorno

```bash
cp .env.example .env.local
nano .env.local
```

Configura como minimo:

- `DATABASE_URL="file:./dev.db"`
- `LOCAL_ADMIN_TOKEN="tu-token"`

Si quieres emails/recordatorios, configura tambien `SMTP_*` y `REMINDER_*`.

## 4) Instalar dependencias y base de datos

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

## 5) Arrancar la app

Opcion A (modo desarrollo):

```bash
npm run dev
```

Opcion B (modo app local con ventana Chrome):

```bash
chmod +x iniciar-gestor.command
./iniciar-gestor.command
```

La app quedara en `http://localhost:3000`.

## 6) (Opcional) Activar recordatorios automaticos diarios

```bash
chmod +x scripts/setup-reminders-launchd.sh
./scripts/setup-reminders-launchd.sh
```

Comprobar estado:

```bash
launchctl print gui/$(id -u)/com.gestorproyectos.reminders
```

## 7) Comandos de verificacion

```bash
npm run typecheck
npm run lint
```

## Problemas comunes

- `command not found: brew`: ejecuta primero el bloque de instalacion de Homebrew.
- `command not found: node` o version vieja: cierra y abre Terminal, y repite `node -v`.
- Errores de Prisma: vuelve a ejecutar `npx prisma generate && npx prisma migrate deploy`.
- Puerto 3000 ocupado: cierra la app previa o usa `npm run dev -- -p 3001`.
