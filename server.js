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

function readBody(req, cb) {
  const chunks = []; let size = 0; const MAX = 30 * 1024 * 1024; // 30 MB cap
  req.on('data', function (c) { size += c.length; if (size > MAX) { req.destroy(); return; } chunks.push(c); });
  req.on('end', function () { cb(Buffer.concat(chunks)); });
}

// Build a subject cutout (transparent background) with a free, local model.
// No Higgsfield needed for this — it runs right here on your machine.
function handleMask(req, res) {
  readBody(req, async function (body) {
    try {
      const parsed = JSON.parse(body.toString('utf8'));
      const image = parsed && parsed.image;
      if (!image) return sendJson(res, 400, { error: 'no_image' });
      const m = String(image).match(/^data:([^;]+);base64,(.*)$/);
      const mime = m ? m[1] : 'image/png';
      const inBuf = Buffer.from(m ? m[2] : String(image).split(',').pop(), 'base64');

      let removeBackground;
      try { removeBackground = require('@imgly/background-removal-node').removeBackground; }
      catch (e) { return sendJson(res, 500, { error: 'dependency_missing', note: 'Run:  npm install @imgly/background-removal-node' }); }

      console.log('  [mask] removing background... (first run downloads the model, ~1 min)');
      const inputBlob = new Blob([inBuf], { type: mime }); // typed Blob so the library detects the format
      const outBlob = await removeBackground(inputBlob);
      const outBuf = Buffer.from(await outBlob.arrayBuffer());
      console.log('  [mask] done.');
      return sendJson(res, 200, { cutout: 'data:image/png;base64,' + outBuf.toString('base64') });
    } catch (e) {
      console.error('  [mask] error:', e);
      return sendJson(res, 500, { error: 'mask_failed', message: String((e && e.message) || e) });
    }
  });
}

const server = http.createServer(function (req, res) {
  const url = req.url.split('?')[0];

  // ---- API routes ----
  if (url.startsWith('/api/')) {
    if (url === '/api/health') {
      return sendJson(res, 200, { ok: true, keyConfigured: HAS_KEY });
    }
    if (url === '/api/mask' && req.method === 'POST') { return handleMask(req, res); }
    // Generation is on hold until we confirm Higgsfield API access.
    if (url === '/api/generate') {
      return sendJson(res, 501, { error: 'not_implemented', note: 'Generation is pending Higgsfield API access.' });
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
