#!/bin/bash

# ==============================================================================
# Script de Lanzamiento - Gestor de Proyectos Entidad (Modo Aplicación Local)
# ==============================================================================

# 1. Configurar el directorio activo
# Asegura que el script se ejecuta en la carpeta donde está ubicado
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================="
echo "  Iniciando Gestor de Proyectos Entidad  "
echo "========================================="

# Añadir rutas comunes donde Mac instala Node.js
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

# 2. Comprobar Node.js
if ! command -v npm &> /dev/null; then
    echo "❌ Error: Node.js (npm) no está instalado."
    echo "Por favor, descarga e instala Node.js desde https://nodejs.org/"
    read -p "Presiona Enter para salir..."
    exit 1
fi

# 3. Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "⏳ Instalando dependencias por primera vez..."
    npm install
fi

# 4. Preparar Base de datos
echo "⏳ Preparando base de datos Prisma..."
if ! npx prisma generate > /dev/null 2>&1; then
    echo "❌ Error al generar el cliente Prisma."
    read -p "Presiona Enter para salir..."
    exit 1
fi

if ! npx prisma migrate deploy > /dev/null 2>&1; then
    echo "❌ Error al aplicar migraciones Prisma de forma segura."
    echo "Revisa el estado con: npx prisma migrate status"
    read -p "Presiona Enter para salir..."
    exit 1
fi

# 5. Iniciar el servidor (Modo Dev para desarrollo ágil y recarga en caliente)
PORT=3000
OWN_SERVER=1
SERVER_PID=""
LOG_FILE="/tmp/gestor-next-dev.log"

if nc -z localhost $PORT >/dev/null 2>&1; then
    echo "⚠️  Ya hay un servidor activo en el puerto $PORT. Se usará el servidor existente."
    OWN_SERVER=0
else
    echo "⏳ Iniciando servidor en el puerto $PORT..."
    npm run dev -- -p $PORT > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
fi

# Función para cerrar el servidor cuando se cierre esta ventana
cleanup() {
    echo ""
    echo "🛑 Cerrando el Gestor de Proyectos..."
    if [ "$OWN_SERVER" -eq 1 ] && [ -n "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    exit
}
trap cleanup EXIT INT TERM

# 6. Esperar a que el servidor esté activo
echo "⏳ Esperando a que el servidor responda..."
MAX_RETRIES=40
RETRY_COUNT=0
while ! nc -z localhost $PORT >/dev/null 2>&1; do
    if [ "$OWN_SERVER" -eq 1 ] && [ -n "$SERVER_PID" ] && ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "❌ Error: El servidor se cerró durante el arranque."
        if [ -f "$LOG_FILE" ]; then
            echo "Últimas líneas de log:"
            tail -n 40 "$LOG_FILE"
        fi
        read -p "Presiona Enter para salir..."
        exit 1
    fi

    sleep 1
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Error: El servidor tardó demasiado en iniciar."
        read -p "Presiona Enter para salir..."
        exit 1
    fi
done

# Dar un par de segundos extra para asegurar que Next.js esté respondiendo HTTP correctamente
sleep 3
echo "✅ Servidor interno listo."

# 7. Abrir la aplicación en Chrome (Modo App)
echo "🌍 Abriendo la aplicación..."
if [ -d "/Applications/Google Chrome.app" ]; then
    # --app quita las barras de navegación, dándole apariencia de aplicación nativa
    # --user-data-dir temporalmente previene que se agrupe con otras ventanas del navegador normal (opcional)
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --app="http://localhost:$PORT"
else
    # Fallback si por alguna razón desinstalas Chrome: abrir navegador por defecto
    open "http://localhost:$PORT"
fi

echo ""
echo "========================================="
echo "🚀 El sistema está en ejecución en Modo Aplicación."
echo "⚠️  IMPORTANTE: No cierres esta ventana de Terminal." 
echo "   Para apagar el programa, simplemente cierra esta ventana negra."
echo "========================================="

# Mantener el script activo esperando al servidor
if [ "$OWN_SERVER" -eq 1 ] && [ -n "$SERVER_PID" ]; then
    wait $SERVER_PID
else
    echo "ℹ️  Este lanzador no inició el servidor. Cierra esta ventana cuando quieras."
    read -p "Presiona Enter para salir..."
fi
