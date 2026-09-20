// Minimal static server for the Mail Factory experience (0.0.0.0:8080)
const http = require('http'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, 'site'); const port = process.env.PORT || 8080;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain', '.md': 'text/markdown' };
http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]); if (url === '/') url = '/index.html';
  const file = path.normalize(path.join(root, url)); if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found: ' + url); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' });
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, '0.0.0.0', () => console.log('serving', root, 'on', port));
