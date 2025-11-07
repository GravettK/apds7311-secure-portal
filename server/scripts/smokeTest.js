// server/scripts/smokeTest.js
// Lightweight health check: attempts HTTPS and fallback HTTP dev port.
// Exit codes: 0 = success, 1 = unreachable, 2 = non-OK JSON, 3 = unexpected error.

const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const PORT = Number(process.env.PORT || 8443);
const DEV_HTTP_PORT = Number(process.env.HTTP_PORT || 8084);
const ENABLE_HTTP_DEV = String(process.env.ENABLE_HTTP_DEV || 'false').toLowerCase() === 'true';

function fetchJson(url, opts = {}) {
	return new Promise((resolve, reject) => {
		const u = new URL(url);
		const lib = u.protocol === 'https:' ? https : http;
		const req = lib.request({
			hostname: u.hostname,
			port: u.port,
			path: u.pathname + u.search,
			method: 'GET',
			rejectUnauthorized: false, // allow self-signed in dev
			timeout: 4000,
			...opts,
		}, (res) => {
			let data = '';
			res.on('data', (c) => (data += c));
			res.on('end', () => {
				try {
					const json = JSON.parse(data || '{}');
					resolve({ status: res.statusCode, json });
				} catch (e) {
					reject(new Error('Invalid JSON response'));
				}
			});
		});
		req.on('error', reject);
		req.on('timeout', () => {
			req.destroy(new Error('Request timeout'));
		});
		req.end();
	});
}

async function main() {
	const httpsUrl = `https://localhost:${PORT}/api/health`;
	const httpUrl = `http://localhost:${DEV_HTTP_PORT}/api/health`;
	let triedHttp = false;
	try {
		const r = await fetchJson(httpsUrl);
		if (r.status === 200 && r.json && r.json.ok) {
			console.log('✅ HTTPS health OK:', r.json);
			process.exit(0);
			return;
		}
		console.error('❌ HTTPS health non-OK status/json:', r.status, r.json);
		process.exit(2);
	} catch (e) {
		console.warn('⚠️ HTTPS health failed:', e.message);
		if (ENABLE_HTTP_DEV) {
			triedHttp = true;
			try {
				const r2 = await fetchJson(httpUrl);
				if (r2.status === 200 && r2.json && r2.json.ok) {
					console.log('✅ HTTP dev health OK:', r2.json);
					process.exit(0);
					return;
				}
				console.error('❌ HTTP dev health non-OK:', r2.status, r2.json);
				process.exit(2);
			} catch (e2) {
				console.error('❌ HTTP dev health failed:', e2.message);
				process.exit(1);
			}
		} else {
			process.exit(1);
		}
	}
}

main().catch((e) => {
	console.error('Unexpected smoke test error:', e);
	process.exit(3);
});
