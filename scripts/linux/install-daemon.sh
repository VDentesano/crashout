#!/bin/bash
# ============================================================
# Auto Company — Linux systemd --user Daemon Installer
# ============================================================
# Installs the auto-loop as a systemd user service with
# auto-restart on crash.
#
# Usage: ./scripts/linux/install-daemon.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVICE_NAME="auto-company.service"
SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_PATH="$SERVICE_DIR/$SERVICE_NAME"
PID_FILE="$PROJECT_DIR/.auto-loop.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[install]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[install]${NC} $1"
}

log_error() {
    echo -e "${RED}[install]${NC} $1"
}

# === Check prerequisites ===

if ! command -v systemctl >/dev/null 2>&1; then
    log_error "systemctl not found. systemd is required."
    exit 1
fi

if ! systemctl --user --version >/dev/null 2>&1; then
    log_error "systemd --user is not available."
    exit 1
fi

# Check that auto-loop.sh exists
if [ ! -f "$PROJECT_DIR/scripts/core/auto-loop.sh" ]; then
    log_error "auto-loop.sh not found at $PROJECT_DIR/scripts/core/auto-loop.sh"
    exit 1
fi

# Ensure engine is available (claude or codex)
ENGINE="${ENGINE:-claude}"
ENGINE="$(echo "$ENGINE" | tr '[:upper:]' '[:lower:]')"

if [ "$ENGINE" = "claude" ]; then
    if ! command -v claude >/dev/null 2>&1; then
        log_error "Claude CLI (claude) not found in PATH. Install it first."
        log_error "   npm install -g @anthropic-ai/claude-code"
        exit 1
    fi
    log_info "Claude CLI found: $(command -v claude)"
elif [ "$ENGINE" = "codex" ]; then
    if ! command -v codex >/dev/null 2>&1; then
        log_error "Codex CLI (codex) not found in PATH. Install it first."
        log_error "   npm install -g @openai/codex"
        exit 1
    fi
    log_info "Codex CLI found: $(command -v codex)"
else
    log_error "Unknown ENGINE: $ENGINE. Use 'claude' or 'codex'."
    exit 1
fi

# === Create systemd user directory ===

mkdir -p "$SERVICE_DIR"

# === Check for existing service ===

if [ -f "$SERVICE_PATH" ]; then
    log_warn "Service file already exists at $SERVICE_PATH"
    log_warn "Stopping existing service..."
    systemctl --user stop "$SERVICE_NAME" 2>/dev/null || true
fi

# === Clean stale PID file ===

if [ -f "$PID_FILE" ]; then
    stale_pid=$(cat "$PID_FILE")
    if ! kill -0 "$stale_pid" 2>/dev/null; then
        log_warn "Removing stale PID file ($stale_pid not running)"
        rm -f "$PID_FILE"
    fi
fi

# === Generate service file ===

log_info "Generating systemd service file..."

cat > "$SERVICE_PATH" << EOF
[Unit]
Description=Auto Company — 24/7 Autonomous AI Loop
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
Environment="HOME=$HOME"
Environment="USER=$USER"
Environment="PATH=$HOME/.local/bin:$HOME/.nvm/versions/node/*/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
ExecStart=$PROJECT_DIR/scripts/core/auto-loop.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF

log_info "Service file written to: $SERVICE_PATH"

# === Reload and enable ===

log_info "Reloading systemd user daemon..."
systemctl --user daemon-reload

log_info "Enabling and starting $SERVICE_NAME..."
systemctl --user enable --now "$SERVICE_NAME"

# === Verify ===

sleep 1
status=$(systemctl --user is-active "$SERVICE_NAME" 2>/dev/null || echo "unknown")

if [ "$status" = "active" ]; then
    log_info "✅ Daemon installed and running!"
    log_info ""
    log_info "Commands:"
    log_info "   make status        # Check status"
    log_info "   make pause         # Pause daemon"
    log_info "   make resume        # Resume daemon"
    log_info "   make uninstall     # Remove daemon"
    log_info "   make monitor       # Tail live logs"
    log_info "   make dashboard     # Start web dashboard"
    log_info ""
    log_info "View logs:"
    log_info "   journalctl --user -u $SERVICE_NAME -f"
    log_info "   tail -f $PROJECT_DIR/logs/auto-loop.log"
else
    log_warn "⚠️  Service status: $status"
    log_warn "Check logs: journalctl --user -u $SERVICE_NAME"
fi

echo ""
exit 0
