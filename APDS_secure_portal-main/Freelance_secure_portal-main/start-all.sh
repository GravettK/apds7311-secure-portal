#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Starting Docker services (MySQL 3307, SonarQube 9001)"
docker compose up -d db sonarqube

echo "==> Waiting for MySQL on localhost:3307"
for i in {1..60}; do
  if nc -z 127.0.0.1 3307; then echo "MySQL is up"; break; fi
  echo "... waiting ($i)"; sleep 1
done

echo "==> Installing server dependencies"
(cd "$ROOT_DIR/server" && npm ci --no-audit --no-fund)

echo "==> Installing client dependencies"
(cd "$ROOT_DIR/client" && npm ci --no-audit --no-fund)

echo "==> Applying database schema and seeding roles/employees"
(cd "$ROOT_DIR/server" && npm run db:schema && npm run seed:roles || true && npm run seed:employees || true)

echo "==> Starting HTTPS API (server)"
(cd "$ROOT_DIR/server" && npm run dev) &
SERVER_PID=$!

echo "==> Starting React client"
(cd "$ROOT_DIR/client" && npm start) &
CLIENT_PID=$!

function finish {
  echo "\n==> Shutting down..."
  kill $SERVER_PID $CLIENT_PID >/dev/null 2>&1 || true
  wait $SERVER_PID $CLIENT_PID >/dev/null 2>&1 || true
}
trap finish EXIT

echo "\n==> All services started"
echo "- API:        https://localhost:8443/api (health: https://localhost:8443/health)"
echo "- Client:     http://localhost:3000"
echo "- SonarQube:  http://localhost:9001"
echo "\nPress Ctrl+C to stop."

wait


