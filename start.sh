#!/bin/bash

# ==============================================================================
# MCP TRON Server - PM2 Start Script (Read-only Mode)
# ==============================================================================

APP_NAME="tron-mcp-readonly"

echo "🚀 Preparing MCP TRON Server for PM2..."

# ------------------------------------------------------------------------------
# 1. Install dependencies and build (before loading .env to avoid NODE_ENV interference)
# ------------------------------------------------------------------------------

if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 not found. Installing globally..."
    npm install -g pm2
fi

echo "📦 Installing dependencies..."
npm install

echo "🛠 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting."
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. Load runtime configuration
# ------------------------------------------------------------------------------

if [ -f .env ]; then
    echo "📄 Loading environment variables from .env..."
    set -a
    source .env
    set +a
fi

export MCP_PORT=${MCP_PORT:-3001}
export MCP_HOST=${MCP_HOST:-0.0.0.0}
export NODE_ENV=${NODE_ENV:-production}

LOG_DIR=${MCP_LOG_DIR:-"./logs"}
mkdir -p "$LOG_DIR"
COMBINED_LOG="$LOG_DIR/pm2-combined.log"
ERROR_LOG="$LOG_DIR/pm2-error.log"

# ------------------------------------------------------------------------------
# 3. Start/Restart with PM2
# ------------------------------------------------------------------------------

if pm2 list | grep -q "$APP_NAME"; then
    echo "🔄 Application '$APP_NAME' is already running. Restarting to apply changes..."
    pm2 restart "$APP_NAME" --update-env
else
    echo "🌐 Starting new server with PM2 as '$APP_NAME'..."
    echo "🔒 Mode: Read-only"
    echo "📝 Logs: $LOG_DIR"

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
