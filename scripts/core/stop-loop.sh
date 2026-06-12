#!/bin/bash
# ============================================================
# Auto Company — Stop Loop
# ============================================================
# Gracefully stops the auto-loop process.
# Supports systemd --user pause/resume on Linux.
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PID_FILE="$PROJECT_DIR/.auto-loop.pid"
PAUSE_FLAG="$PROJECT_DIR/.auto-loop-paused"
SERVICE_NAME="auto-company.service"

stop_loop_process() {
    # Method 1: Signal file (graceful, waits for current cycle to finish)
    touch "$PROJECT_DIR/.auto-loop-stop"
    echo "Stop signal sent. Loop will stop after current cycle completes."

    # Method 2: Also send SIGTERM if PID file exists
    if [ -f "$PID_FILE" ]; then
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Sending SIGTERM to PID $pid..."
            kill -TERM "$pid"
        else
            echo "Process $pid not running. Cleaning up PID file."
            rm -f "$PID_FILE"
        fi
    else
        echo "No PID file found."
    fi
}

pause_daemon() {
    if ! command -v systemctl >/dev/null 2>&1; then
        echo "systemctl not found. Cannot pause daemon."
        exit 1
    fi

    touch "$PAUSE_FLAG"
    echo "Pause flag created: $PAUSE_FLAG"
    stop_loop_process

    if systemctl --user is-active "$SERVICE_NAME" >/dev/null 2>&1; then
        systemctl --user stop "$SERVICE_NAME" 2>/dev/null || true
        echo "Daemon stopped."
    fi
    echo "Daemon paused. Resume with: make resume"
}

resume_daemon() {
    if ! command -v systemctl >/dev/null 2>&1; then
        echo "systemctl not found. Cannot resume daemon."
        exit 1
    fi

    rm -f "$PAUSE_FLAG"
    echo "Pause flag removed."

    if [ ! -f "$HOME/.config/systemd/user/$SERVICE_NAME" ]; then
        echo "Service file not found. Install daemon first: make install"
        exit 1
    fi

    systemctl --user start "$SERVICE_NAME"
    echo "Daemon resumed and started."
}

case "${1:-}" in
    --pause-daemon)
        pause_daemon
        ;;
    --resume-daemon)
        resume_daemon
        ;;
    --help|-h)
        echo "Usage:"
        echo "  ./stop-loop.sh                 # Stop current loop process"
        echo "  ./stop-loop.sh --pause-daemon  # Pause systemd daemon and stop loop"
        echo "  ./stop-loop.sh --resume-daemon # Resume systemd daemon"
        ;;
    *)
        stop_loop_process
        ;;
esac
