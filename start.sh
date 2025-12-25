#!/bin/bash

# Axon ERP - Start Script
# Starts both backend (ERPNext) and frontend (Next.js)

echo "Starting Axon ERP..."
echo "================================"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend/frappe-bench"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

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
    echo "          URL: http://dev.axonerp.local:8000"
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
    echo "          URL: http://dev.axonerp.local:3000"
    echo "          Logs: $SCRIPT_DIR/frontend.log"
fi

echo ""
echo "================================"
echo "[SUCCESS] Axon ERP Started Successfully!"
echo ""
echo "Access Points:"
echo "  Backend:  http://dev.axonerp.local:8000"
echo "  Frontend: http://dev.axonerp.local:3000"
echo ""
echo "View Logs:"
echo "  Backend:  tail -f $SCRIPT_DIR/backend.log"
echo "  Frontend: tail -f $SCRIPT_DIR/frontend.log"
echo ""
echo "To stop services, run: ./stop.sh"
echo "================================"
