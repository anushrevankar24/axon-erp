#!/bin/bash

# Axon ERP - Stop Script
# Stops both backend (ERPNext) and frontend (Next.js)
# Aggressively kills all related processes

echo "Stopping Axon ERP..."
echo "================================"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to kill processes by port
kill_by_port() {
    local PORT=$1
    if command -v lsof > /dev/null 2>&1; then
        local PIDS=$(lsof -t -i:$PORT 2>/dev/null)
        if [ -n "$PIDS" ]; then
            echo "[INFO] Killing processes on port $PORT: $PIDS"
            echo "$PIDS" | xargs kill -9 2>/dev/null
            return 0
        fi
    elif command -v fuser > /dev/null 2>&1; then
        fuser -k $PORT/tcp 2>/dev/null
        return 0
    fi
    return 1
}

# Function to kill processes by pattern
kill_by_pattern() {
    local PATTERN=$1
    local PIDS=$(pgrep -f "$PATTERN" 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "[INFO] Killing processes matching '$PATTERN': $PIDS"
        echo "$PIDS" | xargs kill -9 2>/dev/null
        return 0
    fi
    return 1
}

# Stop backend - Comprehensive kill
echo "[INFO] Stopping Backend (ERPNext)..."
BACKEND_FOUND=false

# Kill by process patterns
for pattern in "bench.*serve" "bench start" "bench.*worker" "bench.*schedule" "frappe.*serve" "gunicorn.*frappe"; do
    if kill_by_pattern "$pattern"; then
        BACKEND_FOUND=true
    fi
done

# Kill by port 8000
if kill_by_port 8000; then
    BACKEND_FOUND=true
fi

# Kill specific backend processes
pkill -9 -f "redis-server.*11000" 2>/dev/null
pkill -9 -f "redis-server.*13000" 2>/dev/null
pkill -9 -f "socketio" 2>/dev/null
pkill -9 -f "node.*esbuild" 2>/dev/null
pkill -9 -f "python.*frappe" 2>/dev/null

# Kill any node processes in backend directory
if [ -d "$SCRIPT_DIR/backend" ]; then
    PIDS=$(pgrep -f "$SCRIPT_DIR/backend" 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "[INFO] Killing backend-related processes: $PIDS"
        echo "$PIDS" | xargs kill -9 2>/dev/null
        BACKEND_FOUND=true
    fi
fi

if [ "$BACKEND_FOUND" = true ]; then
    echo "[SUCCESS] Backend stopped"
    sleep 1  # Give processes time to die
else
    echo "[WARNING] Backend was not running"
fi

# Stop frontend - Comprehensive kill
echo ""
echo "[INFO] Stopping Frontend (Next.js)..."
FRONTEND_FOUND=false

# Kill by process patterns
for pattern in "next dev" "next start" "next-server" "node.*next" "npm.*dev"; do
    if kill_by_pattern "$pattern"; then
        FRONTEND_FOUND=true
    fi
done

# Kill by port 3000
if kill_by_port 3000; then
    FRONTEND_FOUND=true
fi

# Kill any node processes in frontend directory
if [ -d "$SCRIPT_DIR/frontend" ]; then
    PIDS=$(pgrep -f "$SCRIPT_DIR/frontend" 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo "[INFO] Killing frontend-related processes: $PIDS"
        echo "$PIDS" | xargs kill -9 2>/dev/null
        FRONTEND_FOUND=true
    fi
fi

# Kill any node processes that might be running Next.js
PIDS=$(ps aux | grep -E "node.*\.next|node.*next" | grep -v grep | awk '{print $2}')
if [ -n "$PIDS" ]; then
    echo "[INFO] Killing Next.js node processes: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null
    FRONTEND_FOUND=true
fi

if [ "$FRONTEND_FOUND" = true ]; then
    echo "[SUCCESS] Frontend stopped"
    sleep 1  # Give processes time to die
else
    echo "[WARNING] Frontend was not running"
fi

# Verify ports are free
echo ""
echo "[INFO] Verifying ports are free..."
if lsof -i:3000 > /dev/null 2>&1; then
    echo "[WARNING] Port 3000 is still in use, force killing..."
    kill_by_port 3000
    sleep 1
fi

if lsof -i:8000 > /dev/null 2>&1; then
    echo "[WARNING] Port 8000 is still in use, force killing..."
    kill_by_port 8000
    sleep 1
fi

# Clean up lock files
FRONTEND_DIR="$SCRIPT_DIR/frontend"
if [ -f "$FRONTEND_DIR/.next/dev/lock" ]; then
    rm -f "$FRONTEND_DIR/.next/dev/lock"
    echo "[INFO] Cleaned up Next.js lock file"
fi

# Clean up any PID files
find "$SCRIPT_DIR" -name "*.pid" -type f -delete 2>/dev/null
if [ $? -eq 0 ]; then
    echo "[INFO] Cleaned up PID files"
fi

# Final verification
echo ""
echo "[INFO] Final verification..."
PORTS_FREE=true
if lsof -i:3000 > /dev/null 2>&1; then
    echo "[ERROR] Port 3000 is still in use!"
    PORTS_FREE=false
fi
if lsof -i:8000 > /dev/null 2>&1; then
    echo "[ERROR] Port 8000 is still in use!"
    PORTS_FREE=false
fi

if [ "$PORTS_FREE" = true ]; then
    echo "[SUCCESS] All ports are free"
fi

echo ""
echo "================================"
echo "[SUCCESS] Axon ERP Stopped Successfully!"
echo "================================"
