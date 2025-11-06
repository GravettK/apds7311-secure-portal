# Architecture & Security Design

## Data Flow
1. Customer registers: UI -> `POST /api/auth/register` -> server validates (Zod) -> hashes password (bcrypt) -> encrypts SA ID & account -> stores DB.
2. Customer logs in: UI -> `POST /api/auth/login` -> server verifies bcrypt -> issues JWT in httpOnly cookie + CSRF cookie.
3. Customer creates payment: UI attaches `x-csrf-token` -> `POST /api/payments` -> server validates and encrypts SWIFT/account -> stores PENDING.
4. Staff reviews: UI -> `GET /api/staff/payments?status=PENDING` -> server RBAC (employee) -> returns list.
5. Staff verifies: `POST /api/staff/verify` -> status to VERIFIED.
6. Staff submits to SWIFT: `POST /api/staff/submit` with `swiftRef` -> status to SUBMITTED.

## Security Controls
- HTTPS-only API (self-signed in dev; HSTS in prod).
- Helmet with CSP, `frame-ancestors 'none'` (clickjacking), and sane defaults.
- JWT in httpOnly, secure cookie; CSRF double-submit cookie/header.
- Input whitelisting via Zod + regex for email, SA ID, account, SWIFT, currency, amounts.
- Parameterized SQL queries (mysql2) across repositories.
- Sensitive data at rest encrypted using AES-256-GCM (SWIFT, account, SA ID).
- Rate limiting globally and on auth endpoints.
- CORS restricted by `ALLOWED_ORIGIN`.

## Mitigations Mapping
- Session hijacking: httpOnly cookies, HTTPS, short JWT TTL, rate limiting.
- Clickjacking: CSP `frame-ancestors 'none'`.
- SQL injection: Parameterized queries.
- XSS: Helmet CSP, server-side validation, React auto-escaping, no risky `dangerouslySetInnerHTML`.
- MITM: HTTPS everywhere; HSTS in production.
- DDoS: Global and auth-specific rate limits.

## Roles and Access
- customer: can create/list own payments.
- employee: can list by status, verify, submit.

## Storage
- MySQL 8 with foreign keys and indices; audit table scaffolded for future use.

## Operational Notes
- Dev TLS keys auto-generated under `server/ssl/` when absent.
- Encryption key via `DATA_KEY_HEX` must be 64 hex chars.
