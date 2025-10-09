// Core
const fs = require('fs');
const path = require('path');
const https = require('https');

// App & security
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const selfsigned = require('selfsigned');
require('dotenv').config();


// App setup

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://localhost:3000';




// Security middleware

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "frame-ancestors": ["'none'"], 
        "img-src": ["'self'"],
        "font-src": ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false 
  })
);

app.use(
  cors({
    origin: ORIGIN,
    credentials: true
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000, 
    max: 60,            
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./middleware/auth'), require('./routes/payments'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, https: true });
});



// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler 
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});


// HTTPS bootstrap 

const sslDir = path.join(__dirname, 'ssl');
const keyPath = path.join(sslDir, 'key.pem');
const certPath = path.join(sslDir, 'cert.pem');

if (!fs.existsSync(sslDir)) fs.mkdirSync(sslDir, { recursive: true });
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Generating self-signed TLS certificate (dev)…');
  const pems = selfsigned.generate(
    [{ name: 'commonName', value: 'localhost' }],
    { days: 3, keySize: 2048 }
  );
  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);
}

const key = fs.readFileSync(keyPath);
const cert = fs.readFileSync(certPath);

https.createServer({ key, cert }, app).listen(PORT, () => {
  console.log(`✅ HTTPS API running on https://localhost:${PORT}`);
});

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");

  res.setHeader("X-XSS-Protection", "1; mode=block");

  res.setHeader("X-Content-Type-Options", "nosniff");

  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
  );

  next();
});