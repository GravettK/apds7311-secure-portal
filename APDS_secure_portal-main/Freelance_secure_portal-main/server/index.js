const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const selfsigned = require('selfsigned');
require('dotenv').config();
const { requireCsrf } = require('./middleware/csrf');

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT || 8443);
const DEV_HTTP_PORT = Number(process.env.HTTP_PORT || 8084);

const rawOrigins = process.env.ALLOWED_ORIGIN || 'https://localhost:3000';
const ALLOWED_ORIGINS = rawOrigins.split(',').map(s => s.trim());

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "object-src": ["'none'"],
      "frame-ancestors": ["'none'"],
      "img-src": ["'self'", "data:"],
      "font-src": ["'self'"],
      "connect-src": ["'self'"]
    }
  },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false
}));

app.use(cors({
  origin(origin, cb) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.options('*', cors());

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(requireCsrf);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Please try again later.' }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, https: true, env: NODE_ENV });
});

// API Health check with DB ping
app.get('/api/health', async (_req, res) => {
  const startedAt = Date.now();
  let db = { ok: false };
  try {
    const { query } = require('./src/db/db');
    const rows = await query('SELECT 1 AS up');
    db = { ok: rows?.[0]?.up === 1 };
  } catch (e) {
    db = { ok: false, error: 'DB unreachable' };
  }
  res.json({ ok: true, uptimeMs: Date.now() - startedAt, https: true, env: NODE_ENV, db });
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/payments', require('./middleware/auth'), require('./routes/payments'));
app.use('/api/staff', require('./routes/staff'));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const sslDir = path.join(__dirname, 'ssl');
const keyPath = path.join(sslDir, 'key.pem');
const certPath = path.join(sslDir, 'cert.pem');

if (!fs.existsSync(sslDir)) fs.mkdirSync(sslDir, { recursive: true });

let key, cert;

if (NODE_ENV !== 'production') {
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    const pems = selfsigned.generate(
      [{ name: 'commonName', value: 'localhost' }],
      { days: 7, keySize: 2048 }
    );
    fs.writeFileSync(keyPath, pems.private);
    fs.writeFileSync(certPath, pems.cert);
  }
  key = fs.readFileSync(keyPath);
  cert = fs.readFileSync(certPath);
} else {
  key = fs.readFileSync(process.env.TLS_KEY_PATH);
  cert = fs.readFileSync(process.env.TLS_CERT_PATH);
}

const server = https.createServer({ key, cert }, app);

server.listen(PORT, () => {
  console.log(`HTTPS API running on https://localhost:${PORT} (env: ${NODE_ENV})`);
});

// Optional HTTP server for local development to avoid self-signed cert warnings
let httpServer;
if (NODE_ENV !== 'production' && String(process.env.ENABLE_HTTP_DEV).toLowerCase() === 'true') {
  httpServer = http.createServer(app);
  httpServer.listen(DEV_HTTP_PORT, () => {
    console.log(`HTTP (dev) API running on http://localhost:${DEV_HTTP_PORT}`);
  });
}

process.on('SIGINT', () => {
  if (httpServer) httpServer.close(() => {});
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  if (httpServer) httpServer.close(() => {});
  server.close(() => process.exit(0));
});
