#!/bin/bash

# Grant Trader Stop Script
# This script stops all running services

echo "🛑 Stopping Grant Trader services..."

# Kill processes on ports 3000 and 3001
echo "   Stopping backend and frontend..."
lsof -ti :3000 :3001 2>/dev/null | xargs kill -9 2>/dev/null

# Kill ngrok
echo "   Stopping ngrok..."
pkill -f ngrok 2>/dev/null

echo ""
echo "✅ All services stopped!"
