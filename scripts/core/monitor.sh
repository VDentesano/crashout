#!/bin/bash
# ============================================================
# Auto Company — Live Monitor
# ============================================================
# Watch the auto-loop output in real-time.
#
# Usage:
#   ./monitor.sh            # Tail the main log
#   ./monitor.sh --last     # Show last cycle's full output
#   ./monitor.sh --status   # Show current loop status
#   ./monitor.sh --cycles   # Summary of all cycles
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
STATE_FILE="$PROJECT_DIR/.auto-loop-state"
PID_FILE="$PROJECT_DIR/.auto-loop.pid"
SERVICE_NAME="auto-company.service"
HAS_SYSTEMD_USER=0

if command -v systemctl >/dev/null 2>&1 && systemctl --user --version >/dev/null 2>&1; then
    HAS_SYSTEMD_USER=1
fi

case "${1:-}" in
    --status)
        echo "=== Auto Company Status ==="
        if [ -f "$PID_FILE" ]; then
            pid=$(cat "$PID_FILE")
            if kill -0 "$pid" 2>/dev/null; then
                echo "Loop: RUNNING (PID $pid)"
            else
                echo "Loop: STOPPED (stale PID $pid)"
            fi
        else
            echo "Loop: NOT RUNNING"
        fi

        if [ "$HAS_SYSTEMD_USER" -eq 1 ]; then
            daemon_active="$(systemctl --user is-active "$SERVICE_NAME" 2>/dev/null || true)"
            daemon_enabled="$(systemctl --user is-enabled "$SERVICE_NAME" 2>/dev/null || true)"
            if [ "$daemon_active" = "active" ]; then
                echo "Daemon: ACTIVE (systemd --user $SERVICE_NAME)"
            elif [ "$daemon_enabled" = "enabled" ]; then
                echo "Daemon: ENABLED but $daemon_active (systemd --user $SERVICE_NAME)"
            elif [ "$daemon_enabled" = "disabled" ] || [ "$daemon_enabled" = "masked" ]; then
                echo "Daemon: $daemon_enabled (systemd --user $SERVICE_NAME)"
            else
                echo "Daemon: NOT INSTALLED (systemd --user $SERVICE_NAME)"
            fi
        else
            echo "Daemon: N/A (systemd not available)"
        fi

        if [ -f "$STATE_FILE" ]; then
            echo ""
            cat "$STATE_FILE"
        fi

        echo ""
        echo "=== Latest Consensus ==="
        if [ -f "$PROJECT_DIR/memories/consensus.md" ]; then
            head -30 "$PROJECT_DIR/memories/consensus.md"
        else
            echo "(no consensus file)"
        fi

        echo ""
        echo "=== Recent Log ==="
        if [ -f "$LOG_DIR/auto-loop.log" ]; then
            tail -20 "$LOG_DIR/auto-loop.log"
        fi
        ;;

    --last)
        latest=$(ls -t "$LOG_DIR"/cycle-*.log 2>/dev/null | head -1)
        if [ -n "$latest" ]; then
            echo "=== Latest Cycle: $(basename "$latest") ==="
            cat "$latest"
        else
            echo "No cycle logs found."
        fi
        ;;

    --cycles)
        echo "=== Cycle History ==="
        if [ -f "$LOG_DIR/auto-loop.log" ]; then
            grep -E "Cycle #[0-9]+ \[(OK|FAIL|START|LIMIT|BUDGET|BREAKER)\]" "$LOG_DIR/auto-loop.log" | tail -50
        else
            echo "No log found."
        fi
        ;;

    *)
        echo "=== Auto Company Live Monitor (Ctrl+C to stop) ==="
        echo "Watching: $LOG_DIR/auto-loop.log"
        echo ""
        if [ -f "$LOG_DIR/auto-loop.log" ]; then
            tail -f "$LOG_DIR/auto-loop.log"
        else
            echo "No log file yet. Start the loop first: make start"
        fi
        ;;
esac
