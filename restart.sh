#!/bin/bash

# Axon ERP - Restart Script
# Stops and starts both services

echo "Restarting Axon ERP..."
echo "================================"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Stop services
"$SCRIPT_DIR/stop.sh"

echo ""
echo "[INFO] Waiting 3 seconds..."
sleep 3
echo ""

# Start services
"$SCRIPT_DIR/start.sh"
