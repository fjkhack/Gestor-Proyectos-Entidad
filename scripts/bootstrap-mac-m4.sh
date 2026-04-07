#!/bin/bash

set -euo pipefail

echo "==> Gestor-Proyectos-Entidad: bootstrap para Mac M4"

if ! xcode-select -p >/dev/null 2>&1; then
  echo "==> Instalando Command Line Tools de Apple"
  xcode-select --install || true
  echo "⚠️  Cuando termine la instalacion, vuelve a ejecutar este script."
  exit 1
fi

if ! command -v brew >/dev/null 2>&1; then
  echo "==> Instalando Homebrew"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

eval "$(/opt/homebrew/bin/brew shellenv)"

echo "==> Instalando dependencias base (git, node)"
brew install git node

echo "==> Versiones detectadas"
git --version
node -v
npm -v

if [ ! -f .env.local ]; then
  echo "==> Creando .env.local desde .env.example"
  cp .env.example .env.local
  echo "⚠️  Revisa .env.local y ajusta variables (SMTP, tokens, etc.)."
fi

echo "==> Instalando dependencias del proyecto"
npm install

echo "==> Preparando Prisma"
npx prisma generate
npx prisma migrate deploy

echo ""
echo "✅ Bootstrap completado"
echo "Para arrancar:"
echo "  npm run dev"
echo "o"
echo "  chmod +x iniciar-gestor.command && ./iniciar-gestor.command"
