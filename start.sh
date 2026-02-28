#!/bin/bash

# ==============================================================================
# MCP TRON Server - PM2 Start Script (Read-only Mode)
# ==============================================================================

APP_NAME="tron-mcp-readonly"

# ------------------------------------------------------------------------------
# Environment Configuration
# ------------------------------------------------------------------------------
# You can also create a .env file in this directory to manage these variables.
# The script will prefer variables already set in the shell environment.

export MCP_PORT=${MCP_PORT:-3001}
export MCP_HOST=${MCP_HOST:-0.0.0.0}
export NODE_ENV=${NODE_ENV:-production}

# Log configuration
LOG_DIR=${MCP_LOG_DIR:-"./logs"}
mkdir -p "$LOG_DIR"
COMBINED_LOG="$LOG_DIR/pm2-combined.log"
ERROR_LOG="$LOG_DIR/pm2-error.log"

# Blockchain configuration (Uncomment and set these or use shell environment)
# export TRONGRID_API_KEY="your_api_key_here"

# Load .env file if it exists
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env..."
    export $(grep -v '^#' .env | xargs)
fi

echo "🚀 Preparing MCP TRON Server for PM2..."

# 1. Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 not found. Installing globally..."
    npm install -g pm2
fi

# 2. Build the project
echo "🛠 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting."
    exit 1
fi

# 3. Start/Restart with PM2
if pm2 list | grep -q "$APP_NAME"; then
    echo "🔄 Application '$APP_NAME' is already running. Restarting to apply changes..."
    # Update log paths if they changed and restart
    pm2 restart "$APP_NAME" --update-env
else
    echo "🌐 Starting new server with PM2 as '$APP_NAME'..."
    echo "🔒 Mode: Read-only"
    echo "📝 Logs: $LOG_DIR"
    
    # Using -- to pass arguments through PM2 to the node process
    pm2 start build/server/http-server.js \
        --name "$APP_NAME" \
        --update-env \
        --output "$COMBINED_LOG" \
        --error "$ERROR_LOG" \
        --merge-logs \
        -- \
        --readonly
fi

echo "--------------------------------------------------"
echo "✅ Server managed by PM2"
echo "📊 Status: pm2 status"
echo "📝 Logs: pm2 logs $APP_NAME"
echo "🔄 Stop: pm2 stop $APP_NAME"
echo "--------------------------------------------------"
