const path = require('path');
const express = require('express');
const fs = require('fs');
const https = require('https');
const helmet = require('helmet');

// Configuration
const HTTP_PORT = 80;
const HTTPS_PORT = 443;
const DEV_PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const isInternetMode = process.argv.includes('--internet');

const app = express();

// Security Middleware with custom CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.rss2json.com"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
        imgSrc: [
          "'self'",
          "data:",
          "https://i.ytimg.com", // YouTube thumbnails
          // Add other domains as needed
        ],
        // Optionally, add scriptSrc, styleSrc, etc. as needed
      },
    },
  })
);

// Serve original homepage and static files at /
app.use(express.static(PUBLIC_DIR));

const REACT_BUILD_DIR = path.join(__dirname, 'build'); // or wherever you put the build folder
// Serve React app at /riveroflife
app.use('/riveroflife', express.static(REACT_BUILD_DIR));

// For SPA routing: serve index.html for any /riveroflife/* route
app.get('/riveroflife/*', (req, res) => {
  res.sendFile(path.join(REACT_BUILD_DIR, 'index.html'));
});

// Route for original homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Routes
app.get('/leaflet_demo_map', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'leaflet_demo.html'));
});
// Error handling
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});


app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).sendFile(path.join(PUBLIC_DIR, '500.html'));
});

// Server startup
if (isInternetMode) {
  // HTTPS setup
  const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/yuchenh9.dev/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/yuchenh9.dev/fullchain.pem')
  };

  const httpsServer = https.createServer(sslOptions, app);

  // Redirect HTTP to HTTPS
  express()
    .use((req, res) => res.redirect(`https://${req.headers.host}${req.url}`))
    .listen(HTTP_PORT, '0.0.0.0');

  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`\n\x1b[1mSERVER RUNNING IN INTERNET MODE\x1b[0m`);
    console.log(`HTTP -> HTTPS redirect active on port 80`);
    console.log(`Secure server running on port 443`);
    console.log(`Access your site at:\n\x1b[36mhttps://yuchenh9.dev\x1b[0m\n`);
  });
} else {
  // Development mode
  app.listen(DEV_PORT, 'localhost', () => {
    console.log(`\n\x1b[1mSERVER RUNNING IN DEVELOPMENT MODE\x1b[0m`);
    console.log(`Access your site at:\n\x1b[36mhttp://localhost:${DEV_PORT}\x1b[0m\n`);
  });
}
