const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();

// Configuration
const HTTPS_PORT = 8443;
const DEV_PORT = 3001;
const isInternetMode = process.argv.includes('--internet');
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

// Visitor logging middleware (terminal-only)
app.use((req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip;
  const timestamp = new Date().toISOString();
  
  // Color-coded terminal output
  console.log(
    `\x1b[36m[${timestamp}]\x1b[0m \x1b[33m${clientIp}\x1b[0m`,
    `\x1b[32m${req.method} ${req.url}\x1b[0m`,
    `\x1b[35m${req.get('User-Agent')}\x1b[0m`
  );
  
  next();
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/leaflet_demo_map', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'leaflet_demo.html'));
});

// Server startup
if (isInternetMode) {
  // HTTPS setup with SSL certificates
  const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/yuchenh9.dev/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/yuchenh9.dev/fullchain.pem')
  };

  const httpsServer = https.createServer(sslOptions, app);


  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`\x1b[1mPERSONAL WEBSITE - INTERNET MODE\x1b[0m`);
    console.log(`Secure server running on port ${HTTPS_PORT}`);
    console.log(`Access your personal website at:\n\x1b[36mhttps://yuchenh9.dev\x1b[0m\n`);
  });
} else {
  // Development mode
  app.listen(DEV_PORT, 'localhost', () => {
    console.log(`\x1b[1mPERSONAL WEBSITE - DEVELOPMENT MODE\x1b[0m`);
    console.log(`Access:\n- \x1b[34mhttp://localhost:${DEV_PORT}\x1b[0m`);
  });
}
