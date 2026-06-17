#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  JobPilot — Installation Wizard (macOS / Linux)
#  Usage: chmod +x setup.sh && ./setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;92m'
CYAN='\033[0;96m'
YELLOW='\033[0;33m'
RED='\033[0;91m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${GREEN}${BOLD} ╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD} ║         JobPilot — Installation Wizard (macOS / Linux)       ║${RESET}"
echo -e "${GREEN}${BOLD} ╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# ── Check Node.js ─────────────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR]${RESET} Node.js is not installed."
    echo "  Install Node.js 18+ from: https://nodejs.org"
    echo "  Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

NODE_VER=$(node --version)
MAJOR=$(echo $NODE_VER | cut -d. -f1 | tr -d 'v')
if [ "$MAJOR" -lt 18 ]; then
    echo -e "${RED}[ERROR]${RESET} Node.js $NODE_VER detected but version 18+ is required."
    exit 1
fi

echo -e "${GREEN}[OK]${RESET} Node.js $NODE_VER"
echo ""
echo -e "${CYAN}Starting interactive setup wizard...${RESET}"
echo ""

# ── Make setup.js executable and run it ──────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

node "$SCRIPT_DIR/setup.js"

STATUS=$?

if [ $STATUS -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR]${RESET} Setup failed. Review the messages above."
    exit 1
fi

echo ""
echo -e "${GREEN}${BOLD}Setup complete!${RESET}"
echo ""
echo -e "  Run ${CYAN}npm run dev${RESET} to start both servers."
echo ""
