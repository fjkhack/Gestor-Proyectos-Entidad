#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.gestorproyectos.reminders.plist"
OUT_LOG="/tmp/gestor-reminders.out.log"
ERR_LOG="/tmp/gestor-reminders.err.log"

HOUR_FROM_ENV=""
if [ -f "$ROOT_DIR/.env.local" ]; then
  HOUR_FROM_ENV="$(grep -E '^REMINDER_HOUR=' "$ROOT_DIR/.env.local" | tail -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d ' ' || true)"
fi

if [[ "$HOUR_FROM_ENV" =~ ^[0-9]+$ ]] && [ "$HOUR_FROM_ENV" -ge 0 ] && [ "$HOUR_FROM_ENV" -le 23 ]; then
  HOUR="$HOUR_FROM_ENV"
else
  HOUR="9"
fi

mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.gestorproyectos.reminders</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-c</string>
    <string>export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin; cd "$ROOT_DIR"; npm run reminders:run</string>
  </array>

  <key>WorkingDirectory</key>
  <string>$ROOT_DIR</string>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>$HOUR</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>

  <key>RunAtLoad</key>
  <false/>

  <key>StandardOutPath</key>
  <string>$OUT_LOG</string>

  <key>StandardErrorPath</key>
  <string>$ERR_LOG</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/com.gestorproyectos.reminders" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl enable "gui/$(id -u)/com.gestorproyectos.reminders"

echo "LaunchAgent instalado: $PLIST_PATH"
echo "Hora programada: ${HOUR}:00"
echo "Ver estado: launchctl print gui/$(id -u)/com.gestorproyectos.reminders"
echo "Ejecutar ahora: launchctl kickstart -k gui/$(id -u)/com.gestorproyectos.reminders"
echo "Logs: $OUT_LOG y $ERR_LOG"
