#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path


STATUS_PATH = Path("/Users/brandonpackard/command-center/STATUS.md")


def section(text: str, heading: str) -> str:
    pattern = rf"^## {re.escape(heading)}\n(.*?)(?=^## |\Z)"
    match = re.search(pattern, text, flags=re.M | re.S)
    return match.group(1).strip() if match else ""


def bullets(markdown: str, limit: int = 3) -> list[str]:
    found = []
    for line in markdown.splitlines():
        line = line.strip()
        if line.startswith("- [ ]") or line.startswith("- [x]") or line.startswith("- "):
            found.append(re.sub(r"^- \[[ x]\]\s*", "", line))
        if len(found) >= limit:
            break
    return found


def table_items(markdown: str, limit: int = 3) -> list[str]:
    items = []
    for line in markdown.splitlines():
        line = line.strip()
        if not line.startswith("|") or "---" in line:
            continue
        cols = [c.strip() for c in line.strip("|").split("|")]
        if len(cols) >= 1 and cols[0] != "System":
            items.append(cols[0])
        if len(items) >= limit:
            break
    return items


def main() -> int:
    if not STATUS_PATH.exists():
        print("MYTHOS status is unavailable: STATUS.md not found.")
        return 1

    text = STATUS_PATH.read_text()
    header = next((line.strip() for line in text.splitlines() if line.startswith("# ")), "MYTHOS status")
    revenue_match = re.search(r"\*\*MRR:\*\*\s*([^\|]+)\|\s*\*\*Target:\*\*\s*(.+)", text)
    revenue = revenue_match.group(1).strip() if revenue_match else "unknown"
    target = revenue_match.group(2).strip() if revenue_match else "unknown"

    verified_live = table_items(section(text, "Verified LIVE (checked 2026-03-16)"), 4)
    broken = table_items(section(text, "Verified BROKEN (checked 2026-03-14, status unknown as of 2026-03-16)"), 4)
    next_dollar = bullets(section(text, "Revenue — Next Dollar Path"), 2)
    open_items = bullets(section(text, "Open Build Items (as of 2026-03-18)"), 4)

    print(header)
    print(f"Revenue: {revenue} | Target: {target}")
    if verified_live:
        print("Live systems: " + ", ".join(verified_live))
    if broken:
        print("Known broken: " + ", ".join(broken))
    if next_dollar:
        print("Next dollar path: " + " | ".join(next_dollar))
    if open_items:
        print("Open build items: " + " | ".join(open_items))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
