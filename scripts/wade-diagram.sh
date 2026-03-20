#!/usr/bin/env bash
# wade-diagram.sh — Render Mermaid to PNG for Wade
# Usage: echo 'graph LR ...' | wade-diagram [output.png] [theme]
#   or:  wade-diagram input.mmd [output.png] [theme]
#
# Themes: default, dark, forest, neutral
# If no output path given, saves to /tmp/wade-diagram-TIMESTAMP.png

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEFAULT_OUT="/tmp/wade-diagram-${TIMESTAMP}.png"

if [ $# -ge 1 ] && [ -f "$1" ]; then
    # File input mode
    INPUT="$1"
    OUTPUT="${2:-$DEFAULT_OUT}"
    THEME="${3:-default}"
else
    # Stdin pipe mode
    INPUT="/tmp/wade-diagram-input-${TIMESTAMP}.mmd"
    cat > "$INPUT"
    OUTPUT="${1:-$DEFAULT_OUT}"
    THEME="${2:-default}"
fi

if ! command -v mmdc &>/dev/null; then
    echo "ERROR: mmdc not found. Install: npm install -g @mermaid-js/mermaid-cli" >&2
    exit 1
fi

if [ ! -s "$INPUT" ]; then
    echo "ERROR: empty input" >&2
    exit 1
fi

mmdc -i "$INPUT" -o "$OUTPUT" -t "$THEME" -b transparent -q 2>/dev/null

if [ -f "$OUTPUT" ]; then
    echo "$OUTPUT"
else
    echo "ERROR: render failed" >&2
    exit 1
fi
