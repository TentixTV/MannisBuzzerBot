const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class StreamServer {
  constructor(getStateCallback) {
    this.getStateCallback = getStateCallback;
    this.port = 8888;
    this.server = null;
    this.isRunning = false;
    this.sseClients = new Set();
  }

  start() {
    if (this.isRunning) return this.getUrl();

    this.server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname;

      // CORS Headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // 1. Live SSE Stream API (Server-Sent Events for zero-latency instant updates)
      if (pathname === '/api/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive'
        });
        res.write(': connected\n\n');
        const state = this.getStateCallback ? this.getStateCallback() : {};
        res.write(`data: ${JSON.stringify(state)}\n\n`);

        this.sseClients.add(res);

        req.on('close', () => {
          this.sseClients.delete(res);
        });
        return;
      }

      // 1b. Live State API (HTTP Polling fallback)
      if (pathname === '/api/state') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        const state = this.getStateCallback ? this.getStateCallback() : {};
        res.end(JSON.stringify(state));
        return;
      }

      // 2. Audio Stream API
      if (pathname === '/api/audio') {
        const filePath = parsedUrl.query.path;
        if (!filePath || !fs.existsSync(filePath)) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        try {
          const stat = fs.statSync(filePath);
          const ext = path.extname(filePath).toLowerCase();
          let mime = 'audio/mpeg';
          if (ext === '.wav') mime = 'audio/wav';
          else if (ext === '.ogg') mime = 'audio/ogg';
          else if (ext === '.flac') mime = 'audio/flac';
          else if (ext === '.m4a' || ext === '.aac') mime = 'audio/aac';

          res.writeHead(200, {
            'Content-Type': mime,
            'Content-Length': stat.size,
            'Accept-Ranges': 'bytes'
          });

          const readStream = fs.createReadStream(filePath);
          readStream.pipe(res);
        } catch (e) {
          res.writeHead(500);
          res.end(e.message);
        }
        return;
      }

      // 3. Image Stream API
      if (pathname === '/api/image') {
        const filePath = parsedUrl.query.path;
        if (!filePath || !fs.existsSync(filePath)) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        try {
          const stat = fs.statSync(filePath);
          const ext = path.extname(filePath).toLowerCase();
          let mime = 'image/jpeg';
          if (ext === '.png') mime = 'image/png';
          else if (ext === '.webp') mime = 'image/webp';

          res.writeHead(200, {
            'Content-Type': mime,
            'Content-Length': stat.size,
            'Cache-Control': 'no-cache'
          });

          const readStream = fs.createReadStream(filePath);
          readStream.pipe(res);
        } catch (e) {
          res.writeHead(500);
          res.end(e.message);
        }
        return;
      }

      // 4. Stream HTML Overlay
      if (pathname === '/' || pathname === '/stream' || pathname === '/stream.html') {
        const overlayPath = path.join(__dirname, 'renderer', 'stream.html');
        if (fs.existsSync(overlayPath)) {
          const html = fs.readFileSync(overlayPath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
          return;
        }
      }

      // 5. Static Assets in renderer
      const staticPath = path.join(__dirname, 'renderer', pathname.replace(/^\//, ''));
      if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
        const ext = path.extname(staticPath).toLowerCase();
        let mime = 'text/plain';
        if (ext === '.css') mime = 'text/css';
        else if (ext === '.js') mime = 'application/javascript';
        else if (ext === '.png') mime = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        else if (ext === '.svg') mime = 'image/svg+xml';

        res.writeHead(200, { 'Content-Type': mime });
        fs.createReadStream(staticPath).pipe(res);
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    });

    this.server.listen(this.port, '127.0.0.1', () => {
      this.isRunning = true;
      console.log(`[StreamServer] Running at ${this.getUrl()}`);
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        this.port++;
        this.server.listen(this.port, '127.0.0.1');
      } else {
        console.error('[StreamServer] Error:', err);
      }
    });

    return this.getUrl();
  }

  getUrl() {
    return `http://localhost:${this.port}/stream.html`;
  }

  broadcast(state) {
    if (!this.sseClients || this.sseClients.size === 0) return;
    const payload = `data: ${JSON.stringify(state)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (e) {
        this.sseClients.delete(client);
      }
    }
  }

  stop() {
    if (this.sseClients) {
      for (const client of this.sseClients) {
        try { client.end(); } catch (e) {}
      }
      this.sseClients.clear();
    }
    if (this.server && this.isRunning) {
      this.server.close();
      this.isRunning = false;
    }
  }
}

module.exports = StreamServer;
