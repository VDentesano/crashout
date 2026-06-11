# System Information

## Host Environment

| Property | Value |
|----------|-------|
| **OS** | Manjaro Linux |
| **Base** | Arch Linux (rolling release) |
| **Kernel** | Linux 6.12.91-1-MANJARO |
| **Package Manager** | `pacman` |
| **AUR Helper** | `yay` (if available) |
| **Architecture** | x86_64 |
| **Shell** | zsh |

## Important Rules for Agents

1. **Always check OS before installing packages**:
   ```bash
   cat /etc/os-release
   ```

2. **Never use apt-get/yum/dnf** - This is Arch-based, use `pacman`:
   ```bash
   sudo pacman -S <package>
   ```

3. **For AUR packages** (if available):
   ```bash
   yay -S <package>
   ```

4. **Check if package exists**:
   ```bash
   pacman -Ss <package>
   ```

5. **Current installed tools**:
   - `pacman` (package manager)
   - `pnpm` (package manager)
   - `claude` (Claude Code CLI)
   - `git` (version control)
   - `python3` (Python 3.14.5)
   - `make` (build tool)
   - `jq` (JSON processor)
   - `curl` (HTTP client)
   - `node` (Node.js runtime)
   - `npx` (Node executor)

6. **tmux**: Not installed (can be installed via `sudo pacman -S tmux`)

## Auto-Company Status

- **Loop**: Running (PID in `.auto-loop.pid`)
- **Dashboard**: http://127.0.0.1:8787
- **Logs**: `logs/auto-loop.log`
- **Consensus**: `memories/consensus.md`
- **Current Model**: claude-opus-4-8

## Directory Structure

All Auto-Company files are in `/home/valentinod/Documents/crash-crypto/`
