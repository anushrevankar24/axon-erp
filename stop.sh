#!/bin/bash

# Axon ERP - Stop Script
# Stops both backend (ERPNext) and frontend (Next.js)

echo "Stopping Axon ERP..."
echo "================================"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Stop backend
echo "[INFO] Stopping Backend (ERPNext)..."
if pgrep -f "bench.*serve" > /dev/null; then
    pkill -f "bench.*serve"
    pkill -f "redis-server.*11000"
    pkill -f "redis-server.*13000"
    pkill -f "socketio"
    pkill -f "bench.*worker"
    pkill -f "bench.*schedule"
    pkill -f "node.*esbuild"
    echo "[SUCCESS] Backend stopped"
else
    echo "[WARNING] Backend was not running"
fi

# Stop frontend
echo ""
echo "[INFO] Stopping Frontend (Next.js)..."
if lsof -i:3000 > /dev/null 2>&1; then
    PID=$(lsof -t -i:3000)
    kill $PID 2>/dev/null
    echo "[SUCCESS] Frontend stopped"
else
    echo "[WARNING] Frontend was not running"
fi

echo ""
echo "================================"
echo "[SUCCESS] Axon ERP Stopped Successfully!"
echo "================================"
