#!/usr/bin/env node
//
// The dev server for gymloggerapp.com. `npm run dev`.
//
// **Zero dependencies, deliberately.** The obvious move is `live-server` or
// `serve`, and the first one I tried pulled in 191 packages — for a site whose
// whole character is that it has none, and whose deploy is "push to main and
// GitHub serves the files". A dev server that outnumbers the site it serves by
// two orders of magnitude is the wrong trade. Everything below is `node:http`,
// `node:fs` and about sixty lines.
//
// It also means `npm run dev` works straight after a clone with no
// `npm install` at all, which is one fewer thing to be out of date.
//
// What it does beyond `python3 -m http.server`:
//
//  - **A real origin**, which is the reason this exists rather than opening the
//    files directly. `file://` pages get a null origin and the admin tool's
//    fetches to Parse fail CORS, so /admin cannot be tested that way.
//  - **Live reload**, over Server-Sent Events, injected into HTML responses.
//  - **Directory URLs**, so /admin/ serves admin/index.html the way Pages does.
//
// It is not a build step and produces no output directory. The files it serves
// are the files that get deployed, byte for byte.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8000;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp4': 'video/mp4',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json'
};

/** Open SSE connections, one per tab with the site loaded. */
const clients = new Set();

// Injected before </body>. Reconnects on its own, so restarting this server
// refreshes every open tab rather than leaving them silently dead.
const RELOAD_SNIPPET = `
<script>
(() => {
  let source;
  const connect = () => {
    source = new EventSource('/__reload');
    source.onmessage = () => location.reload();
    source.onerror = () => { source.close(); setTimeout(connect, 1000); };
  };
  connect();
})();
</script>
`;

/**
 * The file a URL means, or null if it escapes the project.
 *
 * The containment check is not paranoia about an attacker — this listens on
 * localhost — but about `..` in a path quietly serving something from the home
 * directory and making a missing-file bug look like a working one.
 */
function resolve(urlPath) {
    const clean = decodeURIComponent(urlPath.split('?')[0]);
    let file = path.join(ROOT, clean);
    if (!file.startsWith(ROOT)) return null;
    // A directory means its index.html, which is how GitHub Pages resolves
    // /admin/ — and the reason the admin tool lives in its own folder.
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, 'index.html');
    }
    return file;
}

const server = http.createServer((req, res) => {
    if (req.url.startsWith('/__reload')) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
        });
        res.write('\n');
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
    }

    const file = resolve(req.url);
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Not found: ${req.url}`);
        return;
    }

    const ext = path.extname(file).toLowerCase();
    const type = TYPES[ext] || 'application/octet-stream';

    if (ext === '.html') {
        let html = fs.readFileSync(file, 'utf8');
        html = html.includes('</body>')
            ? html.replace('</body>', `${RELOAD_SNIPPET}</body>`)
            : html + RELOAD_SNIPPET;
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
        res.end(html);
        return;
    }

    // No-store on everything, not just HTML. A cached stylesheet surviving an
    // edit is the classic "why isn't my change showing" half-hour.
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
});

let pending;
fs.watch(ROOT, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    // Editors write a file several times in a few milliseconds, and node_modules
    // or a .swp file changing is not a reason to reload the page.
    if (/node_modules|\.git|\.swp|\.DS_Store/.test(filename)) return;
    clearTimeout(pending);
    pending = setTimeout(() => {
        for (const client of clients) client.write('data: reload\n\n');
    }, 60);
});

server.listen(PORT, () => {
    console.log(`gymloggerapp.com → http://localhost:${PORT}`);
    console.log(`admin tool        → http://localhost:${PORT}/admin/`);
});
