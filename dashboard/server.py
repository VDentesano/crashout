#!/usr/bin/env python3
"""Local dashboard server for Auto Company (Linux runtime)."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


REPO_ROOT = Path(__file__).resolve().parents[1]
DASHBOARD_DIR = Path(__file__).resolve().parent

LINUX_STATUS_SCRIPT = REPO_ROOT / "scripts" / "core" / "monitor.sh"
LINUX_START_SCRIPT = REPO_ROOT / "scripts" / "core" / "auto-loop.sh"
LINUX_STOP_SCRIPT = REPO_ROOT / "scripts" / "core" / "stop-loop.sh"

LOG_FILE = REPO_ROOT / "logs" / "auto-loop.log"
STATE_FILE = REPO_ROOT / ".auto-loop-state"
CONSENSUS_FILE = REPO_ROOT / "memories" / "consensus.md"


def run_shell_script(
    script_path: Path, args: list[str] | None = None, timeout: int = 90
) -> dict[str, Any]:
    cmd = ["/bin/bash", str(script_path)]
    if args:
        cmd.extend(args)

    start = time.time()
    proc = subprocess.run(
        cmd,
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )
    elapsed_ms = int((time.time() - start) * 1000)

    output = (proc.stdout or "").strip()
    error = (proc.stderr or "").strip()
    combined = output
    if error:
        combined = f"{output}\n{error}".strip()

    return {
        "ok": proc.returncode == 0,
        "exitCode": proc.returncode,
        "elapsedMs": elapsed_ms,
        "output": combined,
    }


def read_text_file(path: Path, fallback: str = "") -> str:
    try:
        raw = path.read_bytes()
    except FileNotFoundError:
        return fallback
    except Exception as exc:  # pragma: no cover - defensive
        return f"(read error: {exc})"

    for enc in ("utf-8", "utf-8-sig", "gb18030", "cp936"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue

    return raw.decode("utf-8", errors="replace")


def read_tail(path: Path, lines: int = 120) -> str:
    if lines <= 0:
        return ""
    text = read_text_file(path, "")
    if not text:
        return ""
    rows = text.splitlines()
    return "\n".join(rows[-lines:])


def parse_sections(raw: str) -> dict[str, list[str]]:
    section_re = re.compile(r"^=== (.+) ===$")
    sections: dict[str, list[str]] = {}
    current: str | None = None

    for line in raw.splitlines():
        row = line.rstrip("\n")
        match = section_re.match(row.strip())
        if match:
            current = match.group(1)
            sections[current] = []
            continue
        if current is not None:
            sections[current].append(row)

    return sections


def parse_int(value: str | None) -> int | None:
    if not value:
        return None
    value = value.strip()
    return int(value) if value.isdigit() else None


def parse_positive_int(value: str | None, default: int) -> int:
    try:
        parsed = int(value or "")
    except (TypeError, ValueError):
        return default
    return parsed if parsed > 0 else default


def blank_parsed() -> dict[str, Any]:
    return {
        "daemon": {
            "state": "unknown",
            "activeState": "unknown",
            "subState": "unknown",
            "mainPid": None,
            "raw": "",
        },
        "loop": {
            "state": "unknown",
            "pid": None,
            "daemonSummary": "unknown",
            "engine": "",
            "model": "",
            "lastRun": "",
            "errorCount": "",
            "loopCount": "",
            "raw": "",
        },
        "consensusPreview": "",
        "recentLog": "",
    }


def parse_linux_status_output(raw: str) -> dict[str, Any]:
    """Parse Linux monitor.sh --status output.

    monitor.sh outputs:
      === Auto Company Status ===
      Loop: RUNNING (PID 12345) / STOPPED / NOT RUNNING
      Daemon: ACTIVE (systemd --user auto-company.service) / NOT INSTALLED / etc.
      [blank line]
      STATE_FILE contents (key=value pairs)
      === Latest Consensus ===
      ...
      === Recent Log ===
      ...
    """
    sections = parse_sections(raw)
    parsed = blank_parsed()

    # Daemon: extract from status rows
    status_rows = sections.get("Auto Company Status", [])
    daemon_line = next(
        (x.strip() for x in status_rows if x.strip().startswith("Daemon:")),
        "",
    )
    parsed["daemon"]["raw"] = daemon_line or "No daemon info"
    if daemon_line:
        if "ACTIVE" in daemon_line:
            parsed["daemon"]["state"] = "active"
            parsed["daemon"]["activeState"] = "active"
            parsed["daemon"]["subState"] = "running"
        elif "ENABLED" in daemon_line:
            parsed["daemon"]["state"] = "inactive"
            parsed["daemon"]["activeState"] = "inactive"
            parsed["daemon"]["subState"] = "dead"
        elif "NOT INSTALLED" in daemon_line:
            parsed["daemon"]["state"] = "not_installed"
            parsed["daemon"]["activeState"] = "not_installed"
            parsed["daemon"]["subState"] = "not_installed"
        elif "N/A" in daemon_line:
            parsed["daemon"]["state"] = "unsupported"
            parsed["daemon"]["activeState"] = "n/a"
            parsed["daemon"]["subState"] = "n/a"
        else:
            parsed["daemon"]["state"] = "unknown"

    # Loop: extract PID and state
    loop_line = next(
        (x.strip() for x in status_rows if x.strip().startswith("Loop:")),
        "",
    )
    parsed["loop"]["raw"] = loop_line or "No loop info"
    if loop_line:
        if "RUNNING" in loop_line:
            parsed["loop"]["state"] = "running"
            pid_match = re.search(r"PID (\d+)", loop_line)
            parsed["loop"]["pid"] = int(pid_match.group(1)) if pid_match else None
        elif "STOPPED" in loop_line or "NOT RUNNING" in loop_line:
            parsed["loop"]["state"] = "stopped"
            parsed["loop"]["pid"] = None

    # State file (key=value pairs) appears after the status section
    state_rows = []
    in_state = False
    for row in raw.splitlines():
        stripped = row.strip()
        if stripped.startswith("==="):
            in_state = False
            continue
        if in_state and "=" in stripped:
            state_rows.append(stripped)
        if stripped.startswith("Loop:") or stripped.startswith("Daemon:"):
            in_state = True

    for row in state_rows:
        if row.startswith("ENGINE="):
            parsed["loop"]["engine"] = row.split("=", 1)[1].strip()
        elif row.startswith("MODEL="):
            parsed["loop"]["model"] = row.split("=", 1)[1].strip()
        elif row.startswith("LAST_RUN="):
            parsed["loop"]["lastRun"] = row.split("=", 1)[1].strip()
        elif row.startswith("ERROR_COUNT="):
            parsed["loop"]["errorCount"] = row.split("=", 1)[1].strip()
        elif row.startswith("LOOP_COUNT="):
            parsed["loop"]["loopCount"] = row.split("=", 1)[1].strip()

    parsed["consensusPreview"] = "\n".join(sections.get("Latest Consensus", [])).strip()
    parsed["recentLog"] = "\n".join(sections.get("Recent Log", [])).strip()
    return parsed


def read_state_file_pairs() -> dict[str, str]:
    state_text = read_text_file(STATE_FILE, "").strip()
    state_pairs: dict[str, str] = {}
    if state_text:
        for row in state_text.splitlines():
            if "=" in row:
                key, value = row.split("=", 1)
                state_pairs[key.strip()] = value.strip()
    return state_pairs


def run_status_command() -> dict[str, Any]:
    return run_shell_script(LINUX_STATUS_SCRIPT, args=["--status"], timeout=90)


def run_dashboard_action(action: str) -> dict[str, Any]:
    if action == "start":
        return run_shell_script(LINUX_START_SCRIPT, timeout=120)
    if action == "stop":
        return run_shell_script(LINUX_STOP_SCRIPT, timeout=120)
    if action == "refresh":
        return run_shell_script(LINUX_STATUS_SCRIPT, args=["--status"], timeout=90)
    raise ValueError(f"Unsupported dashboard action: {action}")


def parse_status_output(raw: str) -> dict[str, Any]:
    return parse_linux_status_output(raw)


def gather_status_payload() -> dict[str, Any]:
    result = run_status_command()
    parsed = parse_status_output(result["output"])
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ok": result["ok"],
        "exitCode": result["exitCode"],
        "elapsedMs": result["elapsedMs"],
        "raw": result["output"],
        "parsed": parsed,
        "stateFile": read_state_file_pairs(),
        "consensusHead": read_text_file(CONSENSUS_FILE, "(no consensus file)")[:3000],
        "logTail": read_tail(LOG_FILE, lines=180),
    }


class DashboardHandler(BaseHTTPRequestHandler):
    def _json(self, payload: dict[str, Any], code: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _text(
        self, text: str, code: int = 200, content_type: str = "text/plain; charset=utf-8"
    ) -> None:
        raw = text.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _serve_file(self, path: Path, content_type: str) -> None:
        if not path.exists():
            self._text("Not found", code=404)
            return
        self._text(path.read_text(encoding="utf-8"), content_type=content_type)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/" or path == "/index.html":
            self._serve_file(DASHBOARD_DIR / "index.html", "text/html; charset=utf-8")
            return
        if path == "/app.js":
            self._serve_file(
                DASHBOARD_DIR / "app.js",
                "application/javascript; charset=utf-8",
            )
            return
        if path == "/styles.css":
            self._serve_file(DASHBOARD_DIR / "styles.css", "text/css; charset=utf-8")
            return
        if path == "/favicon.svg":
            self._serve_file(DASHBOARD_DIR / "favicon.svg", "image/svg+xml")
            return
        if path == "/api/status":
            self._json(gather_status_payload())
            return
        if path == "/api/log-tail":
            qs = parse_qs(parsed.query)
            lines = parse_positive_int(qs.get("lines", ["180"])[0], default=180)
            self._json(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "lines": lines,
                    "logTail": read_tail(LOG_FILE, lines=lines),
                }
            )
            return

        self._text("Not found", code=404)

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path
        if path not in {"/api/action/start", "/api/action/stop", "/api/action/refresh"}:
            self._text("Not found", code=404)
            return

        action = path.rsplit("/", 1)[-1]
        result = run_dashboard_action(action)
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "ok": result["ok"],
            "exitCode": result["exitCode"],
            "elapsedMs": result["elapsedMs"],
            "output": result["output"],
        }
        self._json(payload, code=HTTPStatus.OK if result["ok"] else HTTPStatus.BAD_REQUEST)

    def log_message(self, fmt: str, *args: Any) -> None:  # noqa: A003
        _ = (fmt, args)


def main() -> None:
    parser = argparse.ArgumentParser(description="Auto Company web dashboard server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), DashboardHandler)
    print(f"[dashboard] serving on http://{args.host}:{args.port}")
    print(f"[dashboard] repo: {REPO_ROOT}")
    print(f"[dashboard] host: linux")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        print("[dashboard] stopped")


if __name__ == "__main__":
    os.chdir(REPO_ROOT)
    main()
