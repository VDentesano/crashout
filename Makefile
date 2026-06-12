.PHONY: start stop status last cycles monitor dashboard pause resume install uninstall team help clean-logs reset-consensus

ENGINE ?= claude
MODEL ?= fable

# === Quick Start ===

start: ## Start the auto-loop in foreground
	./scripts/core/auto-loop.sh

stop: ## Stop the loop gracefully
	./scripts/core/stop-loop.sh

# === Monitoring ===

status: ## Show loop status + latest consensus
	./scripts/core/monitor.sh --status

last: ## Show last cycle's full output
	./scripts/core/monitor.sh --last

cycles: ## Show cycle history summary
	./scripts/core/monitor.sh --cycles

monitor: ## Tail live logs (Ctrl+C to exit)
	./scripts/core/monitor.sh

dashboard: ## Start local dashboard server
	python3 dashboard/server.py

# === Daemon (systemd --user) ===

install: ## Install systemd --user daemon (auto-start + auto-restart)
	./scripts/linux/install-daemon.sh

uninstall: ## Remove systemd --user daemon
	./scripts/linux/uninstall-daemon.sh

pause: ## Pause daemon (no auto-restart)
	@command -v systemctl >/dev/null 2>&1 || (echo "systemctl not found. Is systemd installed?"; exit 1)
	@systemctl --user stop auto-company.service
	@echo "auto-company.service paused (stopped)."

resume: ## Resume paused daemon
	@command -v systemctl >/dev/null 2>&1 || (echo "systemctl not found. Is systemd installed?"; exit 1)
	@systemctl --user start auto-company.service
	@echo "auto-company.service resumed (started)."

# === Interactive ===

team: ## Start selected engine interactive session (ENGINE=claude|codex)
	@engine="$$(printf '%s' "$(ENGINE)" | tr '[:upper:]' '[:lower:]')"; \
	if [ "$$engine" != "claude" ] && [ "$$engine" != "codex" ]; then \
		echo "Unsupported ENGINE='$(ENGINE)'. Use ENGINE=claude or ENGINE=codex."; \
		exit 1; \
	fi; \
	cd "$(CURDIR)" && "$$engine"

# === Maintenance ===

clean-logs: ## Remove all cycle logs
	rm -f logs/cycle-*.log logs/auto-loop.log.old
	@echo "Cycle logs cleaned."

reset-consensus: ## Reset consensus to initial Day 0 state (CAUTION)
	@echo "This will reset all company progress. Ctrl+C to cancel."
	@sleep 3
	git checkout -- memories/consensus.md
	@echo "Consensus reset to initial state."

# === Help ===

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
