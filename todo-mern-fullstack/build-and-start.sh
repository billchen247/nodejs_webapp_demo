#!/usr/bin/env bash
# Build and start the backend (Express) and frontend (Vite preview) together.
# Usage: ./build-and-start.sh [--dev]
#   (default) build + run production artifacts
#   --dev     skip build, run `npm run dev` for both

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

MODE="prod"
if [[ "${1:-}" == "--dev" ]]; then
  MODE="dev"
fi

install_if_needed() {
  local dir="$1"
  if [[ ! -d "$dir/node_modules" ]]; then
    echo "[deps] installing in $(basename "$dir")"
    (cd "$dir" && npm install)
  fi
}

install_if_needed "$BACKEND"
install_if_needed "$FRONTEND"

if [[ ! -f "$BACKEND/.env" && -f "$BACKEND/.env.example" ]]; then
  echo "[env] copying backend/.env.example -> backend/.env"
  cp "$BACKEND/.env.example" "$BACKEND/.env"
fi

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo
  echo "[stop] shutting down..."
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ "$MODE" == "prod" ]]; then
  echo "[build] backend"
  (cd "$BACKEND" && npm run build)
  echo "[build] frontend"
  (cd "$FRONTEND" && npm run build)

  echo "[start] backend  -> http://localhost:4000"
  (cd "$BACKEND" && npm start) &
  BACKEND_PID=$!

  echo "[start] frontend -> http://localhost:4173 (vite preview)"
  (cd "$FRONTEND" && npm run preview -- --host) &
  FRONTEND_PID=$!
else
  echo "[dev] backend  -> http://localhost:4000"
  (cd "$BACKEND" && npm run dev) &
  BACKEND_PID=$!

  echo "[dev] frontend -> http://localhost:5173"
  (cd "$FRONTEND" && npm run dev) &
  FRONTEND_PID=$!
fi

wait -n "$BACKEND_PID" "$FRONTEND_PID"
