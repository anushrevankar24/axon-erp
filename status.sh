#!/bin/bash

# Axon ERP - Status Script
# Check if services are running

echo "Axon ERP Status"
echo "================================"

# Check Nginx
echo ""
echo "Nginx (Reverse Proxy):"
if command -v systemctl &> /dev/null; then
    # Linux with systemd
    if systemctl is-active --quiet nginx; then
        echo "  Status: Running"
        if lsof -i:80 > /dev/null 2>&1; then
            echo "  Port 80: Listening"
        else
            echo "  Port 80: Not listening"
        fi
    else
        echo "  Status: Not running"
        echo "  Action: sudo systemctl start nginx"
    fi
elif command -v brew &> /dev/null; then
    # macOS with Homebrew
    if brew services list | grep -q "nginx.*started"; then
        echo "  Status: Running"
        if lsof -i:80 > /dev/null 2>&1; then
            echo "  Port 80: Listening"
        else
            echo "  Port 80: Not listening"
        fi
    else
        echo "  Status: Not running"
        echo "  Action: sudo brew services start nginx"
    fi
else
    # Generic check
    if pgrep -x nginx > /dev/null; then
        echo "  Status: Running"
        if lsof -i:80 > /dev/null 2>&1; then
            echo "  Port 80: Listening"
        else
            echo "  Port 80: Not listening"
        fi
    else
        echo "  Status: Not running"
        echo "  Action: sudo nginx"
    fi
fi

# Test nginx routing
if curl -s http://dev.axonerp.local/ > /dev/null 2>&1; then
    echo "  Routing: Working"
    echo "  URL: http://dev.axonerp.local/"
else
    echo "  Routing: Not working"
    echo "  Check: nginx/README.md for setup"
fi

# Check backend
echo ""
echo "Backend (ERPNext):"
if pgrep -f "bench.*serve" > /dev/null; then
    echo "  Status: Running"
    PID=$(pgrep -f "bench.*serve")
    echo "  PID: $PID"
    
    # Test API
    if curl -s http://dev.axonerp.local:8000/api/method/ping > /dev/null 2>&1; then
        echo "  API: Responding"
        echo "  Direct URL: http://dev.axonerp.local:8000"
    else
        echo "  API: Not responding"
    fi
else
    echo "  Status: Not running"
    echo "  Action: cd backend/frappe-bench && bench start"
fi

# Check frontend
echo ""
echo "Frontend (Next.js):"
if lsof -i:3000 > /dev/null 2>&1; then
    echo "  Status: Running"
    PID=$(lsof -t -i:3000)
    echo "  PID: $PID"
    
    # Test frontend
    if curl -s http://dev.axonerp.local:3000 > /dev/null 2>&1; then
        echo "  HTTP: Responding"
        echo "  Direct URL: http://dev.axonerp.local:3000"
    else
        echo "  HTTP: Not responding"
    fi
else
    echo "  Status: Not running"
    echo "  Action: cd frontend && npm run dev"
fi

# Check sites
echo ""
echo "Available Sites:"
SITES_DIR="/home/anush/AxonIntelligence/erp/backend/frappe-bench/sites"
if [ -d "$SITES_DIR" ]; then
    for site in $(ls "$SITES_DIR" 2>/dev/null | grep -E "\.local$"); do
        if [ -d "$SITES_DIR/$site" ] && [ -f "$SITES_DIR/$site/site_config.json" ]; then
            echo "  - $site"
            if curl -s "http://$site:8000/api/method/ping" > /dev/null 2>&1; then
                echo "    Status: Accessible"
            else
                echo "    Status: Not accessible"
            fi
        fi
    done
else
    echo "  No sites directory found"
fi

# Check database
echo ""
echo "Database (MariaDB):"
if command -v netstat &> /dev/null; then
    if netstat -tuln 2>/dev/null | grep 3307 > /dev/null 2>&1; then
        echo "  Status: Running on port 3307"
    else
        echo "  Status: Not running on port 3307"
    fi
elif command -v ss &> /dev/null; then
    if ss -tuln 2>/dev/null | grep 3307 > /dev/null 2>&1; then
        echo "  Status: Running on port 3307"
    else
        echo "  Status: Not running on port 3307"
    fi
else
    if lsof -i:3307 > /dev/null 2>&1; then
        echo "  Status: Running on port 3307"
    else
        echo "  Status: Not running on port 3307"
    fi
fi

# Check Redis
echo ""
echo "Redis:"
if lsof -i:6379 > /dev/null 2>&1; then
    echo "  Main: Running on port 6379"
else
    echo "  Main: Not running"
fi

if lsof -i:11000 > /dev/null 2>&1; then
    echo "  Queue: Running on port 11000"
else
    echo "  Queue: Not running"
fi

if lsof -i:13000 > /dev/null 2>&1; then
    echo "  Cache: Running on port 13000"
else
    echo "  Cache: Not running"
fi

echo ""
echo "================================"

# Calculate overall system status
NGINX_OK=false
BACKEND_OK=false
FRONTEND_OK=false

if systemctl is-active --quiet nginx 2>/dev/null || pgrep -x nginx > /dev/null; then
    # Check if nginx is actually serving (better than lsof which needs sudo)
    if curl -s http://dev.axonerp.local/ > /dev/null 2>&1; then
        NGINX_OK=true
    fi
fi

if pgrep -f "bench.*serve" > /dev/null; then
    if curl -s http://dev.axonerp.local:8000/api/method/ping > /dev/null 2>&1; then
        BACKEND_OK=true
    fi
fi

if lsof -i:3000 > /dev/null 2>&1; then
    FRONTEND_OK=true
fi

echo ""
if [ "$NGINX_OK" = true ] && [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo "✅ SYSTEM STATUS: FULLY OPERATIONAL"
    echo ""
    echo "Access Application:"
    echo "  👉 http://dev.axonerp.local/"
    echo "     (All services running correctly)"
elif [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ] && [ "$NGINX_OK" = false ]; then
    echo "⚠️  SYSTEM STATUS: DEGRADED (Nginx not running)"
    echo ""
    echo "Services running but nginx is required for proper operation!"
    echo ""
    echo "Fix: sudo systemctl start nginx"
    echo ""
    echo "Temporary access (with limited functionality):"
    echo "  Backend:  http://dev.axonerp.local:8000"
    echo "  Frontend: http://dev.axonerp.local:3000"
else
    echo "❌ SYSTEM STATUS: NOT OPERATIONAL"
    echo ""
    echo "Some services are not running. Run ./start.sh to start them."
fi

echo ""
echo "Commands:"
echo "  ./start.sh    - Start all services"
echo "  ./stop.sh     - Stop all services"
echo "  ./restart.sh  - Restart all services"
echo "  ./status.sh   - Show this status"
echo "================================"
