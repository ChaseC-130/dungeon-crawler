const express = require('express');
const path = require('path');
const app = express();

// Serve static files - assets first
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve the specific game file for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-standalone/game.html'));
});

// Also serve game.html directly
app.get('/game.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-standalone/game.html'));
});

// Serve other static files (but not index.html)
app.use(express.static(path.join(__dirname, 'web-standalone'), {
    index: false  // Don't serve index.html automatically
}));

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Web server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to play!`);
});