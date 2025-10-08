const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// simple health route
app.get('/health', (req, res) => {
  res.json({ ok: true, https: true });
});

// --- ensure ssl folder & certs exist ---
const sslDir = path.join(__dirname, 'ssl');
const keyPath = path.join(sslDir, 'key.pem');
const certPath = path.join(sslDir, 'cert.pem');

if (!fs.existsSync(sslDir)) fs.mkdirSync(sslDir);
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

// start HTTPS server
https.createServer({ key, cert }, app).listen(PORT, () => {
  console.log(`✅ HTTPS API running on https://localhost:${PORT}`);
});
