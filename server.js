const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Cache OpenSky data (they rate-limit to ~10 req/min for anonymous)
let cachedFlights = null;
let cacheTime = 0;
const CACHE_TTL = 10000; // 10 seconds

function fetchOpenSky() {
  return new Promise((resolve, reject) => {
    const url = 'https://opensky-network.org/api/states/all';
    console.log('[OpenSky] Fetching live data...');

    const req = https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`OpenSky returned ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`[OpenSky] Got ${parsed.states ? parsed.states.length : 0} aircraft`);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

const server = http.createServer(async (req, res) => {
  // API proxy endpoint
  if (req.url === '/api/flights') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const now = Date.now();
    if (cachedFlights && (now - cacheTime) < CACHE_TTL) {
      console.log('[API] Serving cached data');
      res.end(JSON.stringify(cachedFlights));
      return;
    }

    try {
      cachedFlights = await fetchOpenSky();
      cacheTime = now;
      res.end(JSON.stringify(cachedFlights));
    } catch (err) {
      console.error('[API] Error:', err.message);
      // Return cached data if available, even if stale
      if (cachedFlights) {
        console.log('[API] Serving stale cache');
        res.end(JSON.stringify(cachedFlights));
      } else {
        res.statusCode = 502;
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    return;
  }

  // Static file serving
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath.split('?')[0]);

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-cache');
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  SkyTrack Live server running at http://localhost:${PORT}\n`);
  console.log('  Proxying OpenSky Network API at /api/flights');
  console.log('  Press Ctrl+C to stop\n');
});
