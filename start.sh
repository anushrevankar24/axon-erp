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
NGINX_RUNNING=false
NGINX_PORT_80=false

echo "[INFO] Checking Nginx status..."

if command -v systemctl &> /dev/null; then
    # Linux with systemd
    if systemctl is-active --quiet nginx; then
        NGINX_RUNNING=true
        echo "[SUCCESS] Nginx service is active"
    else
        echo "[ERROR] Nginx service is not running!"
        echo "        Start it with: sudo systemctl start nginx"
        echo "        Enable on boot: sudo systemctl enable nginx"
    fi
elif command -v brew &> /dev/null && brew services list | grep -q "nginx.*started"; then
    # macOS with Homebrew
    NGINX_RUNNING=true
    echo "[SUCCESS] Nginx is running (Homebrew)"
else
    # Check if nginx process exists
    if pgrep -x nginx > /dev/null; then
        NGINX_RUNNING=true
        echo "[SUCCESS] Nginx process is running"
    else
        echo "[ERROR] Nginx is not running!"
        echo "        Start it with: sudo nginx"
    fi
fi

# Check if port 80 is accessible (use curl instead of lsof which needs sudo)
if curl -s --max-time 2 http://dev.axonerp.local/ > /dev/null 2>&1; then
    NGINX_PORT_80=true
    echo "[SUCCESS] Port 80 is listening"
    echo "[SUCCESS] Nginx proxy is responding"
    
    # Test if API proxy works
    if curl -s --max-time 2 http://dev.axonerp.local/api/method/ping > /dev/null 2>&1; then
        echo "[SUCCESS] API proxy is working (/api → backend)"
    else
        echo "[WARNING] API proxy may not be configured correctly"
        echo "          Check: nginx/dev.conf location /api block"
    fi
else
    echo "[ERROR] Port 80 is not accessible!"
    echo "        Nginx may not be configured or listening on port 80"
    echo "        Check: sudo netstat -tlnp | grep :80"
    echo "        Check: sudo nginx -t (test config)"
fi

# Critical check - abort if nginx is not working
if [ "$NGINX_RUNNING" = false ] || [ "$NGINX_PORT_80" = false ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "[CRITICAL] Nginx is not properly configured!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "The application REQUIRES nginx to work properly."
    echo "Without nginx:"
    echo "  ❌ Frontend cannot communicate with backend"
    echo "  ❌ API calls will fail with 404 errors"
    echo "  ❌ Authentication will not work"
    echo "  ❌ You will see console errors"
    echo ""
    echo "Setup instructions:"
    echo "  1. See nginx/README.md for detailed setup"
    echo "  2. sudo systemctl start nginx"
    echo "  3. sudo systemctl enable nginx"
    echo ""
    echo "Do you want to continue anyway? (y/N)"
    read -r -n 1 CONTINUE
    echo ""
    
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        echo "[INFO] Startup cancelled. Please configure nginx first."
        exit 1
    fi
    
    echo "[WARNING] Continuing without nginx - expect errors!"
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
    
    # Clean up any stale lock files
    if [ -f "$FRONTEND_DIR/.next/dev/lock" ]; then
        echo "[INFO] Removing stale Next.js lock file..."
        rm -f "$FRONTEND_DIR/.next/dev/lock"
    fi
    
    cd "$FRONTEND_DIR"
    # Use script to strip ANSI codes and properly log
    nohup npm run dev 2>&1 | sed -u 's/\x1b\[[0-9;]*m//g' > "$SCRIPT_DIR/frontend.log" &
    FRONTEND_PID=$!
    echo "[SUCCESS] Frontend started (PID: $FRONTEND_PID)"
    echo "          Direct URL: http://dev.axonerp.local:3000"
    echo "          Logs: $SCRIPT_DIR/frontend.log"
fi

echo ""
echo "================================"

# Display status summary
if [ "$NGINX_RUNNING" = true ] && [ "$NGINX_PORT_80" = true ]; then
    echo "[SUCCESS] Axon ERP Started Successfully!"
    echo ""
    echo "✅ All services are running correctly:"
    echo "   - Nginx: Running on port 80"
    echo "   - Backend: Running on port 8000"
    echo "   - Frontend: Running on port 3000"
    echo ""
    echo "Access Application:"
    echo "  👉 Main URL: http://dev.axonerp.local/"
    echo "     (Recommended - through nginx proxy)"
else
    echo "[WARNING] Axon ERP Started with Issues!"
    echo ""
    echo "⚠️  Service Status:"
    if [ "$NGINX_RUNNING" = true ]; then
        echo "   ✅ Nginx: Running"
    else
        echo "   ❌ Nginx: NOT running"
    fi
    if [ "$NGINX_PORT_80" = true ]; then
        echo "   ✅ Port 80: Listening"
    else
        echo "   ❌ Port 80: NOT listening"
    fi
    echo "   ✅ Backend: Running on port 8000"
    echo "   ✅ Frontend: Running on port 3000"
    echo ""
    echo "⚠️  Without nginx, you MUST use direct URLs:"
    echo "   Backend:  http://dev.axonerp.local:8000"
    echo "   Frontend: http://dev.axonerp.local:3000"
    echo ""
    echo "   WARNING: Authentication and API calls may not work!"
fi

echo ""
echo "Direct Service URLs (for debugging):"
echo "  Backend:  http://dev.axonerp.local:8000"
echo "  Frontend: http://dev.axonerp.local:3000"
echo ""
echo "View Logs:"
echo "  Backend:  tail -f $SCRIPT_DIR/backend.log"
echo "  Frontend: tail -f $SCRIPT_DIR/frontend.log"
if [ "$NGINX_RUNNING" = true ]; then
    echo "  Nginx:    sudo tail -f /var/log/nginx/error.log"
fi
echo ""
echo "Commands:"
echo "  Stop:     ./stop.sh"
echo "  Status:   ./status.sh"
if [ "$NGINX_RUNNING" = false ]; then
    echo "  Fix Nginx: sudo systemctl start nginx"
fi
echo "================================"
