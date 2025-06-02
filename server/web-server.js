const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS
app.use(cors());

// Serve static files
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use(express.static(path.join(__dirname, '../web-direct')));

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web-direct/index.html'));
});

app.listen(PORT, () => {
    console.log(`Web server running at http://localhost:${PORT}`);
    console.log(`Make sure the game server is also running on port 3001`);
});