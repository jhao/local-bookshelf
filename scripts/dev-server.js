const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, '..', 'src', 'renderer');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon'
};

function resolvePath(urlPath) {
  const safePath = urlPath.split('?')[0].split('#')[0];
  if (safePath === '/' || safePath === '') {
    return path.join(PUBLIC_DIR, 'index.html');
  }
  return path.join(PUBLIC_DIR, safePath);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url || '/');
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.promises
    .readFile(filePath)
    .then((data) => {
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(data);
    })
    .catch((error) => {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
});

server.listen(PORT, HOST, () => {
  console.log(`Local Bookshelf dev server running at http://localhost:${PORT}`);
});
