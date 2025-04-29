const path = require('path');
const express = require('express');
const helmet = require('helmet');

// Configuration
const PORT = process.env.PORT || 3000; // Always use 3000 (Nginx will proxy to this)
const PUBLIC_DIR = path.join(__dirname, 'public');
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// ======================
// Security Middleware
// ======================
app.use(helmet());

// Trust proxy (since Nginx will be forwarding requests)
app.set('trust proxy', true);

// Static files with cache control
app.use(express.static(PUBLIC_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    // Security headers are now handled by Nginx
  }
}));

// ======================
// Visitor Logging
// ======================
app.use((req, res, next) => {
  const protocol = req.secure ? 'HTTPS' : 'HTTP';
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
  
  console.log(
    `\x1b[36m[${new Date().toISOString()}]\x1b[0m`,
    `\x1b[33m${clientIp} (${protocol})\x1b[0m`,
    `\x1b[32m${req.method} ${req.url}\x1b[0m`
  );
  next();
});

// ======================
// Route Handlers
// ======================
const serveFile = (fileName) => (req, res, next) => {
  res.sendFile(path.join(PUBLIC_DIR, fileName), (err) => {
    if (err) next(err);
  });
};

app.get('/', serveFile('index.html'));
app.get('/leaflet_demo_map', serveFile('leaflet_demo.html'));

// ======================
// Error Handling
// ======================
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.use((err, req, res, next) => {
  console.error('\x1b[31mError:\x1b[0m', err);
  res.status(500).sendFile(path.join(PUBLIC_DIR, '500.html'));
});

// ======================
// Server Startup
// ======================
app.listen(PORT, () => {
    if (isProduction) {
    console.log(`\x1b[1mServer running in PRODUCTION mode\x1b[0m`);
    console.log(`Access via Nginx at:\n- \x1b[34mhttps://yuchenh9.dev\x1b[0m`);
  } else {
    console.log(`\x1b[1mServer running in DEVELOPMENT mode\x1b[0m`);
    console.log(`Access at:\n- \x1b[34mhttp://localhost:${PORT}\x1b[0m`);
  }
});