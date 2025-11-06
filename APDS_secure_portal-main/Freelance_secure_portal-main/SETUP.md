# APDS Secure Portal — Setup & Operations Guide

## Prerequisites
- Node.js 18+
- Docker + Docker Compose
- Open ports on host: 3000 (client), 8443 (API), 3307 (MySQL via Docker), 9001 (SonarQube)
- macOS/Linux shell (uses bash and `nc` in startup script)

## Ports Overview
- Client: http://localhost:3000
- API: https://localhost:8443 (health: `/health`, base: `/api`)
- MySQL (Docker): host 3307 -> container 3306
- SonarQube (Docker): host 9001 -> container 9000

## Environment Configuration

### Server
Copy `server/env.example` to `server/.env` and fill values:
```
NODE_ENV=development
PORT=8443
ALLOWED_ORIGIN=https://localhost:3000

# JWT & data-at-rest encryption
JWT_SECRET=<long-random-string>
DATA_KEY_HEX=<64-hex-chars for AES-256-GCM>

# Database
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASS=rootpass
DB_NAME=apds_app

# Seed employee
SEED_EMP_EMAIL=employee1@bank.local
SEED_EMP_PASSWORD=ChangeMe!123
```
Notes:
- `DATA_KEY_HEX` must be exactly 64 hex chars (32 bytes) or encryption will fail.

### Client
Copy `client/env.example` to `client/.env` and fill values:
```
REACT_APP_API_URL=https://localhost:8443/api
```

### SonarQube (local CLI usage)
Export in your shell when running scans manually:
```
export SONAR_HOST_URL=http://localhost:9001
export SONAR_PROJECT_KEY=apds-secure-portal
export SONAR_TOKEN=<your-sonarqube-token>
```

## One-command Startup

Use the provided script to start everything (DB, Sonar, API, Client):
```
chmod +x ./start-all.sh
./start-all.sh
```
This will:
- `docker compose up -d db sonarqube` (MySQL@3307, Sonar@9001)
- Install dependencies in `server/` and `client/`
- Create DB schema + seed roles/employees
- Start HTTPS API (8443) and React client (3000)

Access:
- Client: http://localhost:3000
- API: https://localhost:8443 (health: https://localhost:8443/health)
- SonarQube: http://localhost:9001

Stop: Press Ctrl+C (script traps and stops app processes; Docker services remain running).

## Manual Startup (if you prefer)
```
# Start infra
docker compose up -d db sonarqube

# Server
cd server
npm ci
npm run db:schema
npm run seed:roles
npm run seed:employees
npm run dev   # HTTPS API on 8443

# Client
cd ../client
npm ci
npm start     # React on 3000
```

## SonarQube
- UI: http://localhost:9001 (default login: admin/admin for first time; change password)
- Create a user token to run scans
- Project configuration: `sonar-project.properties`
- To run a scan locally via Docker scanner service:
```
export SONAR_TOKEN=<your-token>
docker compose run --rm -e SONAR_LOGIN=$SONAR_TOKEN sonar-scanner
```

## CircleCI
- Pipeline config: `.circleci/config.yml`
- What the job does:
  - Boots Node + MySQL + SonarQube in the job environment
  - Installs client/server deps
  - Applies DB schema; seeds roles/employees
  - Runs SonarScanner using `sonar-project.properties`
- Required environment variables (create a CircleCI Context, e.g. `SonarQube`):
  - `SONAR_HOST_URL` (e.g., your SonarQube URL)
  - `SONAR_PROJECT_KEY` = `apds-secure-portal`
  - `SONAR_TOKEN` = your Sonar user token

## Security Controls Implemented
- HTTPS-only API with HSTS in production
- Helmet CSP and frame-ancestors for clickjacking/XSS mitigation
- httpOnly, secure cookies; JWT-based session
- CSRF double-submit token for unsafe methods
- Regex whitelisting via Zod schemas for all inputs
- Parameterized queries (mysql2) to prevent SQLi
- Rate limiting (global and auth-specific) for DDoS mitigation
- Encryption at rest (AES-256-GCM) for sensitive fields

## Key Endpoints
- Auth
  - `POST /api/auth/register` — customer registration
  - `POST /api/auth/login` — sets httpOnly session cookie and CSRF cookie
  - `POST /api/auth/logout` — clears cookies
- Customer
  - `POST /api/payments` — create payment (requires auth + CSRF)
  - `GET /api/payments` — list own payments
- Staff (requires role `employee`)
  - `GET /api/staff/payments?status=PENDING|VERIFIED`
  - `POST /api/staff/verify` — body: `{ paymentId }`
  - `POST /api/staff/submit` — body: `{ paymentId, swiftRef }`

## Troubleshooting
- API TLS errors: delete `server/ssl/*` and restart; dev certs regenerate automatically
- Encryption error: ensure `DATA_KEY_HEX` is exactly 64 hex chars
- CORS: ensure `ALLOWED_ORIGIN` matches the client origin exactly
- CSRF: unsafe requests must include `x-csrf-token` header; the client axios adds it from `csrfToken` cookie
- MySQL port in use: host is 3307; if still conflicting, change `docker-compose.yml` mapping

## Useful Commands
```
# Recreate DB schema
(cd server && npm run db:schema)

# Seed roles and employees
(cd server && npm run seed:roles && npm run seed:employees)

# Run Sonar scanner (via compose service)
export SONAR_TOKEN=<token>
docker compose run --rm -e SONAR_LOGIN=$SONAR_TOKEN sonar-scanner
```

## References
- SonarQube: `sonar-project.properties`
- CircleCI: `.circleci/config.yml`
- Startup script: `start-all.sh`
