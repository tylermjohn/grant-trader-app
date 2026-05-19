#!/bin/bash

# Grant Trader Startup Script
# This script starts the backend, frontend, and ngrok tunnel

echo "🚀 Starting Grant Trader..."

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing processes on ports 3000 and 3001
echo "📌 Cleaning up existing processes..."
lsof -ti :3000 :3001 2>/dev/null | xargs kill -9 2>/dev/null
pkill -f ngrok 2>/dev/null

# Start backend
echo "🔧 Starting backend server..."
cd "$SCRIPT_DIR/backend"
nohup node src/server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd "$SCRIPT_DIR/frontend"
BROWSER=none nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "⏳ Waiting for frontend to compile..."
sleep 15

# Start ngrok
echo "🌐 Starting ngrok tunnel..."
nohup ngrok http 3000 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
echo "   Ngrok PID: $NGROK_PID"

# Wait for ngrok to initialize
sleep 5

# Get ngrok URL
echo ""
echo "✅ All services started!"
echo ""
echo "📊 Process IDs:"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo "   Ngrok: $NGROK_PID"
echo ""

# Try to get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data = json.load(sys.stdin); print([t['public_url'] for t in data.get('tunnels', []) if 'https' in t['public_url']][0] if data.get('tunnels') else '')" 2>/dev/null)

if [ -n "$NGROK_URL" ]; then
    echo "🌍 Public URL: $NGROK_URL"
    echo ""
    echo "📧 Share this URL with your collaborators!"
else
    echo "⚠️  Could not retrieve ngrok URL. Please check http://localhost:4040"
fi

echo ""
echo "📝 Logs:"
echo "   Backend: $SCRIPT_DIR/backend/backend.log"
echo "   Frontend: $SCRIPT_DIR/frontend/frontend.log"
echo "   Ngrok: /tmp/ngrok.log"
echo ""
echo "🛑 To stop all services, run: ./stop.sh"
echo ""
