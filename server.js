// server.js — local dev server for the Inpainting Prototype (MaskForge).
//
// What this does:
//   1. Serves the prototype (index.html etc.) at http://localhost:3000
//   2. Will proxy the Higgsfield API calls (mask, generate) so your API key
//      stays HERE on the server and never goes into the browser / public code.
//
// No npm install needed — this uses only built-in Node modules.
// Run it with:  node server.js

const http = require('http');
const fs   = require('fs');
const path = require('path');

// ---- load your key from a local .env file (tiny parser, no dependency) ----
function loadEnv(file) {
  try {
    const txt = fs.readFileSync(path.join(__dirname, file), 'utf8');
    txt.split(/\r?\n/).forEach(function (line) {
      if (!line || line.trim().startsWith('#')) return;
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] = m[2].trim();
    });
  } catch (e) { /* no .env yet — fine until you create one */ }
}
loadEnv('.env');

const PORT      = process.env.PORT || 3000;
const HF_ID     = process.env.HF_API_KEY_ID || '';
const HF_SECRET = process.env.HF_API_KEY_SECRET || '';
const HAS_KEY   = !!(HF_ID && HF_SECRET);

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/markdown'
};

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(function (req, res) {
  const url = req.url.split('?')[0];

  // ---- API routes ----
  if (url.startsWith('/api/')) {
    if (url === '/api/health') {
      return sendJson(res, 200, { ok: true, keyConfigured: HAS_KEY });
    }
    // These get wired to Higgsfield next — placeholders for now.
    if (url === '/api/mask' || url === '/api/generate') {
      return sendJson(res, 501, { error: 'not_implemented', note: 'We wire this to Higgsfield in the next step.' });
    }
    return sendJson(res, 404, { error: 'unknown_endpoint' });
  }

  // ---- static files (the prototype) ----
  let rel = (url === '/' ? '/index.html' : url);
  const full = path.join(__dirname, decodeURIComponent(rel));
  if (!full.startsWith(__dirname)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(full, function (err, data) {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, function () {
  console.log('\n  MaskForge — local dev server');
  console.log('  ▶ open  http://localhost:' + PORT + '\n');
  console.log('  Higgsfield key: ' + (HAS_KEY
    ? 'loaded ✓'
    : 'NOT set yet — create a .env file (copy .env.example) and paste your key') + '\n');
});
