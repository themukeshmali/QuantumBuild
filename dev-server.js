// QuantumBuild — Local Dev Server (no MongoDB needed)
// Serves frontend + dashboard as static files
// Run: node dev-server.js
// Then open: http://localhost:000/frontend/index.html

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5000;

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
};

http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);

    // Root → redirect to store
    if (urlPath === '/') {
        res.writeHead(302, { Location: '/frontend/index.html' });
        return res.end();
    }

    const filePath = path.join(__dirname, urlPath);

    fs.stat(filePath, (err, stat) => {
        if (!err && stat.isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mime = MIME[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`404 Not Found: ${urlPath}`);
        }
    });
}).listen(PORT, () => {
    console.log(`\n  QuantumBuild Dev Server running!\n`);
    console.log(`  Store     → http://localhost:${PORT}/frontend/index.html`);
    console.log(`  Parts     → http://localhost:${PORT}/frontend/parts.html`);
    console.log(`  PCs       → http://localhost:${PORT}/frontend/pcs.html`);
    console.log(`  Login     → http://localhost:${PORT}/frontend/login.html`);
    console.log(`  Dashboard → http://localhost:${PORT}/dashboard/index.html`);
    console.log(`\n  Press Ctrl+C to stop\n`);
});
