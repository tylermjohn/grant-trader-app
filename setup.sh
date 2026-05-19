#!/bin/bash

echo "Grant Trader Setup Script"
echo "=========================="
echo ""

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install backend dependencies"
    exit 1
fi
echo "Backend dependencies installed successfully"
echo ""

echo "Running database migrations..."
npm run migrate
if [ $? -ne 0 ]; then
    echo "Error: Failed to run database migrations"
    exit 1
fi
echo "Database setup complete"
echo ""

echo "Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install frontend dependencies"
    exit 1
fi
echo "Frontend dependencies installed successfully"
echo ""

echo "=========================="
echo "Setup Complete!"
echo "=========================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend (in one terminal):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. (Optional) Run the scrapers to populate data:"
echo "   cd backend"
echo "   npm run scrape"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
