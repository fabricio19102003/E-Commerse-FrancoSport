#!/usr/bin/env bash
# Shared settings and helpers for demo/start.sh, demo/stop.sh and demo/reset.sh (sourced, not run).

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DEMO_DIR")"
API_DIR="$ROOT_DIR/FrancoSport-API"
WEB_DIR="$ROOT_DIR/FrancoSport-web"
LOCAL_DIR="$DEMO_DIR/.local"
COMPOSE_FILE="$DEMO_DIR/docker-compose.yml"

# Ports that do not clash with the other local projects (8000/54320 barbershop, 5173/3000 defaults)
export DEMO_DB_PORT="${DEMO_DB_PORT:-33316}"
DEMO_API_PORT="${DEMO_API_PORT:-3101}"
DEMO_WEB_PORT="${DEMO_WEB_PORT:-5183}"

API_URL="http://localhost:$DEMO_API_PORT"
WEB_URL="http://localhost:$DEMO_WEB_PORT"
API_PID_FILE="$LOCAL_DIR/api.pid"
WEB_PID_FILE="$LOCAL_DIR/web.pid"
API_LOG="$LOCAL_DIR/api.log"
WEB_LOG="$LOCAL_DIR/web.log"

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

say() { printf '%s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

# True when the PID file names a live process that is one of ours (guards against a recycled PID)
pid_running() {
  local file="$1" pattern="$2" pid
  [[ -f "$file" ]] || return 1
  pid="$(cat "$file")"
  [[ "$pid" =~ ^[0-9]+$ ]] && [[ -r "/proc/$pid/cmdline" ]] || return 1
  tr '\0' ' ' < "/proc/$pid/cmdline" | grep -q -- "$pattern"
}

# Run a command in the background in its own session, detached from this terminal and its pipes.
# The PID file gets the PID of the command itself (the shell execs it), also its process group id.
start_detached() {
  local pid_file="$1" log="$2"
  shift 2
  setsid bash -c 'echo $$ > "$0"; exec "$@"' "$pid_file" "$@" >> "$log" 2>&1 < /dev/null &
}

# Stop the process of a PID file (it runs in its own session, so the whole group goes down)
stop_pid() {
  local file="$1" pattern="$2" label="$3" pid
  if pid_running "$file" "$pattern"; then
    pid="$(cat "$file")"
    kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
    kill -0 "$pid" 2>/dev/null && kill -KILL -- "-$pid" 2>/dev/null || true
    say "  $label detenido (PID $pid)"
  else
    say "  $label no estaba en marcha"
  fi
  : > "$file"
}

port_busy() { ss -ltn "( sport = :$1 )" 2>/dev/null | tail -n +2 | grep -q .; }
