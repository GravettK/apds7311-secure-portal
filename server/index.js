const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');
const helmet = require('helmet');                 // <-- add
const cors = require('cors');                     // <-- add
const rateLimit = require('express-rate-limit');  // <-- add
const cookieParser = require('cookie-parser');    // <-- add
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

/* ========= Security middleware ========= */
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "frame-ancestors": ["'none'"]      // clickjacking defense
    }
  },
  crossOriginEmbedderPolicy: false        // dev convenience
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'https://localhost:3000',
  credentials: true
}));

app.use(rateLimit({
  windowMs: 60 * 1000,                    // 1 minute
  max: 60,                                // 60 req/min/IP
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
/* ====================================== */

// simple health route (kept the same)
app.get('/health', (req, res) => {
  res.json({ ok: true, https: true });
});

/* ======== SSL bootstrapping (unchanged) ======== */
const sslDir = path.join(__dirname, 'ssl');
const keyPath = path.join(sslDir, 'key.pem');
const certPath = path.join(sslDir, 'cert.pem');

if (!fs.existsSync(sslDir)) fs.mkdirSync(sslDir);
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Generating self-signed TLS certificate (dev)…');
  const pems = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 3, keySize: 2048 });
  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);
}

const key = fs.readFileSync(keyPath);
const cert = fs.readFileSync(certPath);

https.createServer({ key, cert }, app).listen(PORT, () => {
  console.log(`✅ HTTPS API running on https://localhost:${PORT}`);
});
