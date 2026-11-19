import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./app/', import.meta.url));
const index = process.argv.indexOf('--port');
const candidate = index < 0 ? 8080 : Number(process.argv[index + 1]);
const port = Number.isInteger(candidate) && candidate > 0 && candidate < 65536 ? candidate : 8080;
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.jpg':'image/jpeg', '.png':'image/png', '.ttf':'font/ttf', '.txt':'text/plain' };
createServer((req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Invalid path'); return; }
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(root, '.' + path);
  if (!file.startsWith(resolve(root) + sep)) { res.writeHead(403).end('Forbidden'); return; }
  try {
    const info = statSync(file);
    if (!info.isFile()) throw new Error();
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'content-length': info.size, 'cache-control':'no-store' });
    createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Studio listening on port ${port}`));
