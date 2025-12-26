#!/bin/bash

# Axon ERP - Start Script
# Starts backend (ERPNext), frontend (Next.js), and verifies nginx

echo "Starting Axon ERP..."
echo "================================"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend/frappe-bench"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check nginx status
echo "[INFO] Checking Nginx status..."
if command -v systemctl &> /dev/null; then
    # Linux with systemd
    if systemctl is-active --quiet nginx; then
        echo "[SUCCESS] Nginx is running"
    else
        echo "[WARNING] Nginx is not running!"
        echo "          Start it with: sudo systemctl start nginx"
        echo "          See nginx/README.md for setup instructions"
    fi
elif command -v brew &> /dev/null && brew services list | grep -q "nginx.*started"; then
    # macOS with Homebrew
    echo "[SUCCESS] Nginx is running"
else
    # Check if nginx process exists
    if pgrep -x nginx > /dev/null; then
        echo "[SUCCESS] Nginx is running"
    else
        echo "[WARNING] Nginx is not running!"
        echo "          Start it with: sudo nginx"
        echo "          See nginx/README.md for setup instructions"
    fi
fi

# Check if port 80 is accessible
if lsof -i:80 > /dev/null 2>&1; then
    echo "[SUCCESS] Port 80 is listening"
else
    echo "[WARNING] Port 80 is not listening!"
    echo "          Nginx may not be configured correctly"
fi

echo ""

# Check if backend is already running
if pgrep -f "bench.*serve" > /dev/null; then
    echo "[WARNING] Backend is already running"
else
    echo "[INFO] Starting Backend (ERPNext)..."
    cd "$BACKEND_DIR"
    source "$SCRIPT_DIR/.venv/bin/activate"
    nohup bench start > "$SCRIPT_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo "[SUCCESS] Backend started (PID: $BACKEND_PID)"
    echo "          Direct URL: http://dev.axonerp.local:8000"
    echo "          Logs: $SCRIPT_DIR/backend.log"
fi

# Wait for backend to be ready
echo ""
echo "[INFO] Waiting for backend to be ready..."
sleep 5

BACKEND_READY=false
for i in {1..12}; do
    if curl -s http://dev.axonerp.local:8000/api/method/ping > /dev/null 2>&1; then
        echo "[SUCCESS] Backend is ready!"
        BACKEND_READY=true
        break
    fi
    echo "          Attempt $i/12..."
    sleep 2
done

if [ "$BACKEND_READY" = false ]; then
    echo ""
    echo "[ERROR] Backend failed to start!"
    echo "        Check logs: tail -f $SCRIPT_DIR/backend.log"
    echo ""
    echo "Common issues:"
    echo "  - Port 8000 already in use"
    echo "  - MariaDB not running (port 3307)"
    echo "  - Redis not running"
    echo "  - Site configuration error"
    exit 1
fi

# Check if frontend is already running
if lsof -i:3000 > /dev/null 2>&1; then
    echo ""
    echo "[WARNING] Frontend is already running on port 3000"
else
    echo ""
    echo "[INFO] Starting Frontend (Next.js)..."
    cd "$FRONTEND_DIR"
    nohup npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "[SUCCESS] Frontend started (PID: $FRONTEND_PID)"
    echo "          Direct URL: http://dev.axonerp.local:3000"
    echo "          Logs: $SCRIPT_DIR/frontend.log"
fi

echo ""
echo "================================"
echo "[SUCCESS] Axon ERP Started Successfully!"
echo ""
echo "Access Application:"
echo "  Main URL: http://dev.axonerp.local/"
echo "            (through nginx on port 80)"
echo ""
echo "Direct Service URLs (for debugging only):"
echo "  Backend:  http://dev.axonerp.local:8000"
echo "  Frontend: http://dev.axonerp.local:3000"
echo ""
echo "IMPORTANT: Always use http://dev.axonerp.local/ (port 80)"
echo "           Do NOT access :3000 or :8000 directly"
echo ""
echo "View Logs:"
echo "  Backend:  tail -f $SCRIPT_DIR/backend.log"
echo "  Frontend: tail -f $SCRIPT_DIR/frontend.log"
echo "  Nginx:    sudo tail -f /var/log/nginx/error.log"
echo ""
echo "To stop services, run: ./stop.sh"
echo "================================"
