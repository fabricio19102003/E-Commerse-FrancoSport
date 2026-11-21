#!/usr/bin/env bash
# Wipes the local Franco Sport demo: stops everything, deletes the demo database volume, the images
# uploaded during the demo and the generated local files (demo/.local). Asks for confirmation first.
# Use --yes to skip the question. The next demo/start.sh builds everything again from the seed.
set -euo pipefail

# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

cat <<EOF
Esto BORRA los datos de la demo: usuarios registrados, pedidos, productos editados, cupones,
imágenes subidas y la sesión de todos. La base vuelve al estado inicial en el próximo demo/start.sh.
EOF
if [[ "${1:-}" != "--yes" ]]; then
  read -r -p "¿Borrar todo? Escriba 'si' para continuar: " answer
  [[ "$answer" == "si" ]] || { say "Cancelado, no se borró nada."; exit 1; }
fi

"$DEMO_DIR/stop.sh"

say "Borrando la base de datos de la demo..."
command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 \
  || fail "Docker no responde: no se pudo borrar el volumen"
compose down --volumes --remove-orphans >/dev/null

say "Borrando archivos locales de la demo..."
UPLOADS_DIR="$API_DIR/storage/uploads"
[[ "$LOCAL_DIR" == "$ROOT_DIR/demo/.local" && "$UPLOADS_DIR" == "$ROOT_DIR/FrancoSport-API/storage/uploads" ]] \
  || fail "Ruta inesperada, no se borra nada más"
rm -rf -- "$LOCAL_DIR" "$UPLOADS_DIR"

say "Listo. Para empezar de cero: demo/start.sh"
