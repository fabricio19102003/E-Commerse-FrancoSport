#!/usr/bin/env bash
# Starts the local Franco Sport demo: MySQL (Docker), API and web, all in the background.
# Nothing is written to .env files: the API environment lives in this script's process only.
# Generated local state (JWT secrets, PIDs, logs) goes to demo/.local/, which git ignores.
set -euo pipefail

# shellcheck source=lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

# ----- Requirements -----
say "Comprobando requisitos..."
command -v docker >/dev/null || fail "Docker no está instalado (https://docs.docker.com/engine/install/)"
docker info >/dev/null 2>&1 || fail "Docker no responde: ¿está iniciado y su usuario tiene permiso? (sudo systemctl start docker)"
docker compose version >/dev/null 2>&1 || fail "Falta el plugin 'docker compose' (v2)"
command -v node >/dev/null || fail "Node.js no está instalado (se necesita la versión 20 o superior)"
command -v npm >/dev/null || fail "npm no está instalado"
command -v curl >/dev/null || fail "curl no está instalado"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" -ge 20 ]] || fail "Node.js $(node -v) es muy antiguo: se necesita la versión 20 o superior"

mkdir -p "$LOCAL_DIR"
chmod 700 "$LOCAL_DIR"

# ----- Ports: ours (already running) or free -----
if ! pid_running "$API_PID_FILE" "src/server.js" && port_busy "$DEMO_API_PORT"; then
  fail "El puerto $DEMO_API_PORT (API) está ocupado por otro programa. Use otro: DEMO_API_PORT=3102 demo/start.sh"
fi
if ! pid_running "$WEB_PID_FILE" "vite" && port_busy "$DEMO_WEB_PORT"; then
  fail "El puerto $DEMO_WEB_PORT (web) está ocupado por otro programa. Use otro: DEMO_WEB_PORT=5184 demo/start.sh"
fi
if ! compose ps --status running --services 2>/dev/null | grep -qx mysql && port_busy "$DEMO_DB_PORT"; then
  fail "El puerto $DEMO_DB_PORT (MySQL) está ocupado por otro programa. Use otro: DEMO_DB_PORT=33317 demo/start.sh"
fi

# ----- MySQL -----
say "Iniciando MySQL (Docker, volumen 'francosport-demo-mysql')..."
compose up -d --wait mysql >"$LOCAL_DIR/mysql.log" 2>&1 \
  || fail "MySQL no arrancó. Revise $LOCAL_DIR/mysql.log y: docker compose -f demo/docker-compose.yml logs mysql"

# ----- Dependencies -----
for dir in "$API_DIR" "$WEB_DIR"; do
  if [[ ! -d "$dir/node_modules" ]]; then
    say "Instalando dependencias de $(basename "$dir") (npm ci)..."
    (cd "$dir" && npm ci --no-audit --no-fund >/dev/null)
  fi
done

# ----- JWT secrets: generated once, kept private to the user (0600) -----
SECRETS_FILE="$LOCAL_DIR/jwt-secrets"
if [[ ! -f "$SECRETS_FILE" ]]; then
  (
    umask 077
    {
      printf 'JWT_SECRET=%s\n' "$(node -e 'process.stdout.write(require("crypto").randomBytes(48).toString("hex"))')"
      printf 'JWT_REFRESH_SECRET=%s\n' "$(node -e 'process.stdout.write(require("crypto").randomBytes(48).toString("hex"))')"
    } > "$SECRETS_FILE"
  )
fi
chmod 600 "$SECRETS_FILE"

# ----- API environment (this process only) -----
export NODE_ENV=development
export PORT="$DEMO_API_PORT"
# Listen on this computer only: the demo API is not exposed on the local network
export HOST=127.0.0.1
export DATABASE_URL="mysql://root:francosport_demo@127.0.0.1:$DEMO_DB_PORT/francosport_demo"
JWT_SECRET="$(sed -n 's/^JWT_SECRET=//p' "$SECRETS_FILE")"
JWT_REFRESH_SECRET="$(sed -n 's/^JWT_REFRESH_SECRET=//p' "$SECRETS_FILE")"
export JWT_SECRET JWT_REFRESH_SECRET
export FRONTEND_URL="$WEB_URL"
# Development-only image storage on this machine (the API refuses it in production)
export STORAGE_DRIVER=local
export PUBLIC_API_URL="$API_URL"
# Demo accounts (the seed never changes a password once it was changed in the app)
export SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-FrancoAdmin2026}"
export SEED_USER_PASSWORD="${SEED_USER_PASSWORD:-FrancoCliente2026}"

# ----- Database -----
say "Preparando la base de datos (schema y datos de ejemplo)..."
(
  cd "$API_DIR"
  npx prisma db push --skip-generate >/dev/null
  npx prisma generate >/dev/null
  # The seed is idempotent, but it only needs to run when the demo data is missing
  HAS_ADMIN="$(node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ log: [] });
    prisma.user.count({ where: { email: "admin@francosport.com" } })
      .then((n) => process.stdout.write(String(n)))
      .finally(() => prisma.$disconnect());
  ')"
  if [[ "$HAS_ADMIN" != "1" || ! -f "$LOCAL_DIR/seeded" ]]; then
    npm run --silent db:seed >/dev/null
    : > "$LOCAL_DIR/seeded"
  fi
)

# ----- API -----
if pid_running "$API_PID_FILE" "src/server.js"; then
  say "La API ya estaba en marcha (PID $(cat "$API_PID_FILE"))."
else
  [[ -f "$API_LOG" ]] && mv -f "$API_LOG" "$API_LOG.1"
  say "Iniciando la API en $API_URL ..."
  (cd "$API_DIR" && start_detached "$API_PID_FILE" "$API_LOG" node src/server.js)
fi

# ----- Web: production build served by `vite preview` -----
# A build (instead of the dev server) loads faster in front of the owner, behaves like the real
# site and needs no file watchers. It is rebuilt only when the API URL or the sources change.
BUILD_STAMP="$LOCAL_DIR/web-build.stamp"
if [[ ! -f "$WEB_DIR/dist/index.html" || ! -f "$BUILD_STAMP" || "$(cat "$BUILD_STAMP")" != "$API_URL/api" ]] \
  || [[ -n "$(find "$WEB_DIR/src" "$WEB_DIR/public" "$WEB_DIR/index.html" "$WEB_DIR/package.json" -newer "$BUILD_STAMP" -print -quit)" ]]; then
  say "Compilando la web (tarda ~1 minuto la primera vez)..."
  (cd "$WEB_DIR" && VITE_API_URL="$API_URL/api" npm run --silent build > "$WEB_LOG" 2>&1) \
    || fail "La compilación de la web falló. Revise $WEB_LOG"
  printf '%s' "$API_URL/api" > "$BUILD_STAMP"
fi
if pid_running "$WEB_PID_FILE" "vite"; then
  say "La web ya estaba en marcha (PID $(cat "$WEB_PID_FILE"))."
else
  say "Iniciando la web en $WEB_URL ..."
  (cd "$WEB_DIR" && start_detached "$WEB_PID_FILE" "$WEB_LOG" node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port "$DEMO_WEB_PORT" --strictPort)
fi

# ----- Wait until both answer -----
wait_for() {
  local url="$1" label="$2" log="$3"
  for _ in $(seq 1 60); do
    curl -fsS -o /dev/null "$url" 2>/dev/null && return 0
    sleep 1
  done
  tail -n 20 "$log" >&2 || true
  fail "$label no respondió en $url (vea $log)"
}
wait_for "$API_URL/api/health" "La API" "$API_LOG"
wait_for "$WEB_URL" "La web" "$WEB_LOG"

cat <<EOF

Franco Sport está listo para la demostración.

  Tienda (web):  $WEB_URL
  API:           $API_URL/api/health
  Registro:      $API_LOG   (los enlaces de verificación y de recuperación salen aquí)

  Administrador: admin@francosport.com   / $SEED_ADMIN_PASSWORD
  Cliente:       cliente@francosport.com / $SEED_USER_PASSWORD
  Cupones:       FRANCO20 (20%), ENVIOGRATIS (envío gratis desde Bs. 200)

  Detener (los datos se conservan): demo/stop.sh
  Borrar todo y empezar de cero:    demo/reset.sh
EOF
