#!/bin/bash

# Axon ERP - Status Script
# Check if services are running

echo "Axon ERP Status"
echo "================================"

# Check backend
echo ""
echo "Backend (ERPNext):"
if pgrep -f "bench.*serve" > /dev/null; then
    echo "  Status: Running"
    PID=$(pgrep -f "bench.*serve")
    echo "  PID: $PID"
    
    # Test API
    if curl -s http://axon.local:8000/api/method/ping > /dev/null 2>&1; then
        echo "  API: Responding"
        echo "  URL: http://axon.local:8000"
    else
        echo "  API: Not responding"
    fi
else
    echo "  Status: Not running"
fi

# Check frontend
echo ""
echo "Frontend (Next.js):"
if lsof -i:3000 > /dev/null 2>&1; then
    echo "  Status: Running"
    PID=$(lsof -t -i:3000)
    echo "  PID: $PID"
    
    # Test frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "  HTTP: Responding"
        echo "  URL: http://localhost:3000"
    else
        echo "  HTTP: Not responding"
    fi
else
    echo "  Status: Not running"
fi

# Check sites
echo ""
echo "Available Sites:"
SITES_DIR="/home/anush/AxonIntelligence/erp/backend/frappe-bench/sites"
for site in $(ls "$SITES_DIR" | grep -E "\.local$"); do
    if [ -d "$SITES_DIR/$site" ] && [ -f "$SITES_DIR/$site/site_config.json" ]; then
        echo "  - $site"
        if curl -s "http://$site:8000/api/method/ping" > /dev/null 2>&1; then
            echo "    Status: Accessible"
        else
            echo "    Status: Not accessible"
        fi
    fi
done

# Check database
echo ""
echo "Database (MariaDB):"
if netstat -tuln | grep 3307 > /dev/null 2>&1; then
    echo "  Status: Running on port 3307"
else
    echo "  Status: Not running on port 3307"
fi

# Check Redis
echo ""
echo "Redis:"
if netstat -tuln | grep 6379 > /dev/null 2>&1; then
    echo "  Main: Running on port 6379"
else
    echo "  Main: Not running"
fi

if netstat -tuln | grep 11000 > /dev/null 2>&1; then
    echo "  Queue: Running on port 11000"
else
    echo "  Queue: Not running"
fi

if netstat -tuln | grep 13000 > /dev/null 2>&1; then
    echo "  Cache: Running on port 13000"
else
    echo "  Cache: Not running"
fi

echo ""
echo "================================"
echo ""
echo "Commands:"
echo "  ./start.sh    - Start all services"
echo "  ./stop.sh     - Stop all services"
echo "  ./restart.sh  - Restart all services"
echo "  ./status.sh   - Show this status"
echo "================================"
