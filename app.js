const path = require('path');
const express = require('express');
const fs = require('fs');
const https = require('https');
const helmet = require('helmet');

// Configuration
const HTTP_PORT = 8080;  // Different port for personal website
const HTTPS_PORT = 8443; // Different port for personal website
const DEV_PORT = 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');
const isInternetMode = process.argv.includes('--internet');

const app = express();

// Domains configuration
const PERSONAL_WEBSITE_DOMAINS = [
  'yuchenh9.dev',
  'www.yuchenh9.dev',
  'localhost:3001',  // for development - different port from church app
  'yuchen.localhost' // alternative local domain
];
///root
///Users/yuchenhuang/Downloads/riveroflifecu
// Virtual Host Middleware
const createVirtualHost = (domains, handler) => {
  return (req, res, next) => {
    const host = req.get('host');
    if (domains.some(domain => host === domain || host.startsWith(domain))) {
      handler(req, res, next);
    } else {
      next();
    }
  };
};

// Security Middleware with custom CSP (applied globally)
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

// =============================================================================
// PERSONAL WEBSITE APP - Virtual Host Configuration
// =============================================================================

// Create a sub-app for Personal Website
const personalWebsiteApp = express();

// Serve static files
personalWebsiteApp.use(express.static(PUBLIC_DIR));

// Route for homepage
personalWebsiteApp.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Routes for personal website
personalWebsiteApp.get('/leaflet_demo_map', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'leaflet_demo.html'));
});

// Add more personal website routes here
// personalWebsiteApp.get('/portfolio', (req, res) => {
//   res.sendFile(path.join(PUBLIC_DIR, 'portfolio.html'));
// });

// Error handling for personal website
personalWebsiteApp.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

personalWebsiteApp.use((err, req, res, next) => {
  console.error('Personal website error:', err);
  res.status(500).sendFile(path.join(PUBLIC_DIR, '500.html'));
});

// Mount Personal Website app for specific domains
app.use(createVirtualHost(PERSONAL_WEBSITE_DOMAINS, personalWebsiteApp));

// =============================================================================
// OTHER DOMAINS - Add more virtual hosts here
// =============================================================================

// Example: Add another domain/app
// const OTHER_DOMAINS = ['anotherdomain.com', 'www.anotherdomain.com'];
// const otherApp = express();
// otherApp.get('/', (req, res) => {
//   res.send('<h1>Another Domain App</h1>');
// });
// app.use(createVirtualHost(OTHER_DOMAINS, otherApp));

// =============================================================================
// DEFAULT/FALLBACK HANDLER
// =============================================================================

// Default handler for unmatched domains
app.use((req, res) => {
  const host = req.get('host');
  res.status(404).send(`
    <h1>Domain Not Found</h1>
    <p>The domain <strong>${host}</strong> is not configured on this server.</p>
    <p>Available domains:</p>
    <ul>
      ${PERSONAL_WEBSITE_DOMAINS.map(domain => `<li>${domain}</li>`).join('')}
    </ul>
  `);
});

// Global error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server error');
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
    console.log(`\nConfigured domains:`);
    console.log(`Personal Website: ${PERSONAL_WEBSITE_DOMAINS.join(', ')}`);
    console.log(`Access your site at:\n\x1b[36mhttps://yuchenh9.dev\x1b[0m\n`);
  });
} else {
  // Development mode
  app.listen(DEV_PORT, 'localhost', () => {
    console.log(`\n\x1b[1mSERVER RUNNING IN DEVELOPMENT MODE\x1b[0m`);
    console.log(`\nConfigured domains:`);
    console.log(`Personal Website: ${PERSONAL_WEBSITE_DOMAINS.join(', ')}`);
    console.log(`Access your site at:\n\x1b[36mhttp://localhost:${DEV_PORT}\x1b[0m\n`);
  });
}
