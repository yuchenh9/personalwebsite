const path = require('path');
const express = require('express');
const fs = require('fs');
const https = require('https');
const helmet = require('helmet'); // Security middleware

// Configuration
const HTTP_PORT = 80;
const HTTPS_PORT = 443;
const PUBLIC_DIR = path.join(__dirname, 'public');
const isInternetMode = process.argv.includes('--internet') || process.env.DEPLOY_MODE === 'internet';

// SSL Certificate Configuration (Update these paths with your actual certificate files)
const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/yuchenh9.dev/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yuchenh9.dev/fullchain.pem'),
  minVersion: 'TLSv1.2' // Enforce modern TLS only
};

const app = express();

// ======================
// Security Middleware
// ======================
app.use(helmet()); // Basic security headers
app.use(helmet.hsts({ // Force HTTPS
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));

// Static files with cache control
app.use(express.static(PUBLIC_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

// ======================
// Visitor Logging (Enhanced)
// ======================
app.use((req, res, next) => {
  const protocol = req.secure ? 'HTTPS' : 'HTTP';
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  const timestamp = new Date().toISOString();
  
  console.log(
    `\x1b[36m[${timestamp}]\x1b[0m \x1b[33m${clientIp} (${protocol})\x1b[0m`,
    `\x1b[32m${req.method} ${req.url}\x1b[0m`,
    `\x1b[35m${req.get('User-Agent')}\x1b[0m`
  );
  next();
});

// ======================
// Route Handlers
// ======================
const serveSecureFile = (fileName) => (req, res, next) => {
  // In production, enforce HTTPS
  if (isInternetMode && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  
  res.sendFile(path.join(PUBLIC_DIR, fileName), {
    headers: {
      'Content-Security-Policy': "default-src 'self'"
    }
  }, (err) => {
    if (err) next(err);
  });
};

app.get('/', serveSecureFile('index.html'));
app.get('/leaflet_demo_map', serveSecureFile('leaflet_demo.html'));

// ======================
// Error Handling
// ======================
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.use((err, req, res, next) => {
  console.error('\x1b[31mError:\x1b[0m', err);
  res.status(500).sendFile(path.join(PUBLIC_DIR, '500.html'));
});

// ======================
// Server Startup
// ======================
if (isInternetMode) {
  // Create HTTPS server
  const httpsServer = https.createServer(sslOptions, app);
  
  // HTTP server for redirection to HTTPS
  express()
    .use((req, res) => res.redirect(`https://${req.headers.host}${req.url}`))
    .listen(HTTP_PORT, '0.0.0.0');
  
  // HTTPS server
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log('\x1b[1mServer running in INTERNET mode (HTTPS)\x1b[0m');
    console.log(`Access:\n- \x1b[34mhttps://yuchenh9.dev\x1b[0m`);
    console.log(`- \x1b[34mhttps://localhost\x1b[0m (local)`);
  });
} else {
  // Development (HTTP only)
  app.listen(3000, 'localhost', () => {
    console.log('\x1b[1mServer running in LOCAL mode (HTTP)\x1b[0m');
    console.log(`Access:\n- \x1b[34mhttp://localhost:3000\x1b[0m`);
  });
}