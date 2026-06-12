#!/bin/bash
# ============================================================
# Auto Company — Linux systemd --user Daemon Uninstaller
# ============================================================
# Removes the auto-company systemd user service and cleans
# up state files.
#
# Usage: ./scripts/linux/uninstall-daemon.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVICE_NAME="auto-company.service"
SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_PATH="$SERVICE_DIR/$SERVICE_NAME"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[uninstall]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[uninstall]${NC} $1"
}

log_error() {
    echo -e "${RED}[uninstall]${NC} $1"
}

# === Check prerequisites ===

if ! command -v systemctl >/dev/null 2>&1; then
    log_error "systemctl not found."
    exit 1
fi

# === Stop and disable service ===

if [ -f "$SERVICE_PATH" ]; then
    log_info "Stopping $SERVICE_NAME..."
    systemctl --user stop "$SERVICE_NAME" 2>/dev/null || true
    
    log_info "Disabling $SERVICE_NAME..."
    systemctl --user disable "$SERVICE_NAME" 2>/dev/null || true
    
    log_info "Removing service file: $SERVICE_PATH"
    rm -f "$SERVICE_PATH"
    
    log_info "Reloading systemd user daemon..."
    systemctl --user daemon-reload
else
    log_warn "Service file not found at $SERVICE_PATH"
    log_warn "Checking if service is still registered..."
    
    if systemctl --user list-unit-files "$SERVICE_NAME" 2>/dev/null | grep -q "$SERVICE_NAME"; then
        log_info "Stopping and disabling registered service..."
        systemctl --user stop "$SERVICE_NAME" 2>/dev/null || true
        systemctl --user disable "$SERVICE_NAME" 2>/dev/null || true
        systemctl --user daemon-reload
    fi
fi

# === Clean up state files ===

log_info "Cleaning up state files..."

removed=0
for f in "$PROJECT_DIR/.auto-loop.pid" "$PROJECT_DIR/.auto-loop-paused" "$PROJECT_DIR/.auto-loop-stop"; do
    if [ -f "$f" ]; then
        rm -f "$f"
        log_info "  Removed: $(basename "$f")"
        removed=$((removed + 1))
    fi
done

if [ "$removed" -eq 0 ]; then
    log_info "  No state files to clean up."
fi

log_info "✅ Daemon uninstalled successfully."
log_info ""
log_info "You can still run the loop in foreground:"
log_info "   make start"
log_info ""

exit 0
