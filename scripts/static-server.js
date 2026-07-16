// Minimal static file server for previewing exported builds locally.
// Usage: node scripts/static-server.js <dir> [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8099);

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.map': 'application/json',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(dir, urlPath);
  if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const index = path.join(file, 'index.html');
    file = fs.existsSync(index) ? index : path.join(dir, 'index.html'); // SPA fallback
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log(`serving ${dir} on http://localhost:${port}`));
