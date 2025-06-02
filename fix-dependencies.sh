#!/bin/bash
echo "Fixing dependency issues..."

# Remove problematic files
echo "Cleaning up..."
rm -rf node_modules
rm -f package-lock.json

# Install with legacy peer deps to bypass conflicts
echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "Dependencies installed!"
echo ""
echo "Now you can run the game with:"
echo "  npm run server    # In one terminal"
echo "  node web-server.js  # In another terminal"
echo "  Open http://localhost:8080 in your browser"