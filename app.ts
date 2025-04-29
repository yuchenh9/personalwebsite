const path=require('path')
const express = require('express')
const app = express();

// Configuration
let PORT=3000;
const isInternetMode = process.argv.includes('--internet') || process.env.DEPLOY_MODE === 'internet';
if (isInternetMode) {
  PORT = 80;
}
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

app.use((req, res, next) => {
  next();
});
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
  //res.send(`Hello World! Running in ${isInternetMode ? 'INTERNET' : 'LOCAL'} mode`);

  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});
app.get('/leaflet_demo_map', (req, res) => {
  //res.send(`Hello World! Running in ${isInternetMode ? 'INTERNET' : 'LOCAL'} mode`);

  res.sendFile(path.join(PUBLIC_DIR, 'leaflet_demo.html'));
});

// Start server
const address = isInternetMode ? '0.0.0.0' : 'localhost';
app.listen(PORT, address, () => {
  console.log(`\x1b[1mServer running in ${isInternetMode ? 'INTERNET' : 'LOCAL'} mode\x1b[0m`);
  console.log(`Access:\n- \x1b[34mhttp://${address}:${PORT}\x1b[0m`);
});