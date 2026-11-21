#!/usr/bin/env bash
# Stops the local Franco Sport demo (web, API and MySQL). The data is kept: start.sh brings it back.
set -euo pipefail

# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

say "Deteniendo la demo..."
mkdir -p "$LOCAL_DIR"
stop_pid "$WEB_PID_FILE" "vite" "Web"
stop_pid "$API_PID_FILE" "src/server.js" "API"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  compose stop mysql >/dev/null 2>&1 && say "  MySQL detenido (datos conservados en el volumen 'francosport-demo-mysql')"
fi
say "Listo. Para volver a iniciar: demo/start.sh"
