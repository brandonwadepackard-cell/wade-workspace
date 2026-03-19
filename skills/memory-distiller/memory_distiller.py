#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path


SUPABASE_URL = "https://rjcoeoropwvqzvinopze.supabase.co"
GEMINI_MODEL = "gemini-2.5-flash"
VERSION = "2026-03-18-hardened-2"
STATE_PATH = Path("/Users/brandonpackard/.openclaw/workspace/skills/memory-distiller/state.json")
BACKUP_DIR = Path("/Users/brandonpackard/.openclaw/workspace/skills/memory-distiller/backups")
LOG_PATH = Path("/Users/brandonpackard/.openclaw/logs/memory-distiller.log")
LOCK_PATH = Path("/Users/brandonpackard/.openclaw/workspace/skills/memory-distiller/memory_distiller.lock")
ERROR_COOLDOWN_HOURS = 6

TECH_PATTERNS = [
    r"`[^`]+`",
    r"/Users/",
    r"\b[A-Z_]{4,}\b",
    r"\b(?:api|mcp|rpc|rag|daemon|launchagent|playwright|cdp|supabase|postgres|curl|json|cron|webhook|embedding|langgraph)\b",
    r"\b\d+/\d+\b",
    r"\b(?:http|https)://",
]

EXECUTION_MARKERS = [
    "built",
    "deployed",
    "validated",
    "verified",
    "fixed",
    "daemon",
    "launchagent",
    "bridge",
    "pipeline",
    "mcp",
    "cdp",
    "supabase",
    "agent_messages",
    "router",
    "embedding",
    "webhook",
]

ALLOWED_TYPES = {
    "achievement",
    "critical_lesson",
    "operating_rule",
    "optimization_strategy",
    "architectural_blueprint",
    "teachable_skill",
}


def get_stash(label: str) -> str:
    result = subprocess.run(
        [
            "security",
            "find-generic-password",
            "-a",
            "brandonpackard",
            "-s",
            f"stash.{label}",
            "-w",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"missing stash key: {label}")
    return result.stdout.strip()


def ensure_dirs() -> None:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)


def log(message: str) -> None:
    ensure_dirs()
    timestamp = utc_now().isoformat()
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(f"{timestamp} {message}\n")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def load_state() -> dict:
    if not STATE_PATH.exists():
        return {"processed": {}}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        log("state-load-error resetting processed state")
        return {"processed": {}}


def save_state(state: dict) -> None:
    ensure_dirs()
    temp_path = STATE_PATH.with_suffix(".json.tmp")
    temp_path.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")
    temp_path.replace(STATE_PATH)


def recent_cutoff(hours: int) -> str:
    cutoff = utc_now() - timedelta(hours=hours)
    return cutoff.isoformat()


def acquire_lock() -> object | None:
    ensure_dirs()
    handle = LOCK_PATH.open("w", encoding="utf-8")
    try:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        handle.close()
        return None
    handle.write(f"{utc_now().isoformat()} pid={os.getpid()}\n")
    handle.flush()
    return handle


def fetch_recent_memories(limit: int, hours: int, anon_key: str) -> list[dict]:
    params = {
        "select": "id,content,importance,memory_type,tags,created_at",
        "created_at": f"gte.{recent_cutoff(hours)}",
        "order": "created_at.desc",
        "limit": str(limit),
    }
    url = f"{SUPABASE_URL}/rest/v1/wade_memories?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url,
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def technical_score(memory: dict) -> int:
    text = memory.get("content", "")
    score = 0
    for pattern in TECH_PATTERNS:
        score += len(re.findall(pattern, text, flags=re.I))
    if text.count("\n- ") >= 3:
        score += 2
    if text.count("\n#") >= 2:
        score += 2
    if len(text) > 1200:
        score += 2
    if memory.get("memory_type") in {
        "achievement",
        "knowledge",
        "architectural_blueprint",
        "teachable_skill",
        "optimization_strategy",
    }:
        score += 1
    return score


def execution_marker_score(text: str) -> int:
    lowered = text.lower()
    return sum(1 for marker in EXECUTION_MARKERS if marker in lowered)


def should_distill(memory: dict) -> bool:
    text = memory.get("content", "")
    importance = int(memory.get("importance") or 0)
    score = technical_score(memory)
    marker_score = execution_marker_score(text)
    memory_type = memory.get("memory_type") or ""
    if len(text.strip()) < 180:
        return False
    if text.startswith("Source:"):
        return False
    if memory_type not in ALLOWED_TYPES and importance < 10:
        return False
    if memory_type in {"knowledge", "reference", "elemental_identity", "preference", "insight"}:
        return False
    if importance >= 10:
        return marker_score >= 2 or score >= 12
    return marker_score >= 3 and score >= 8


def backup_memory(memory: dict) -> None:
    ensure_dirs()
    date_key = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    backup_path = BACKUP_DIR / f"{date_key}.jsonl"
    with backup_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(memory, ensure_ascii=True) + "\n")


def distill_with_gemini(content: str, gemini_key: str) -> str:
    prompt = (
        "Rewrite this dense AI execution log into a casual diary entry format. "
        "Preserve all important facts, names, dates, lessons, and outcomes. "
        "Use plain English. Keep it compact, human, and readable. "
        "Do not use markdown tables. Do not invent facts.\n\n"
        f"TEXT:\n{content}"
    )
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={gemini_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1200,
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        body = json.loads(response.read().decode("utf-8"))
    candidates = body.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"gemini-empty-candidates {body!r}")
    parts = candidates[0].get("content", {}).get("parts") or []
    texts = [part.get("text", "").strip() for part in parts if isinstance(part, dict)]
    distilled = "\n".join(text for text in texts if text).strip()
    if not distilled:
        raise RuntimeError(f"gemini-empty-text {body!r}")
    return distilled


def patch_memory(memory_id: str, new_content: str, service_role_key: str) -> None:
    url = f"{SUPABASE_URL}/rest/v1/wade_memories?id=eq.{urllib.parse.quote(memory_id)}"
    request = urllib.request.Request(
        url,
        data=json.dumps({"content": new_content}).encode("utf-8"),
        method="PATCH",
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    with urllib.request.urlopen(request, timeout=20):
        return


def parse_iso8601(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def should_back_off(prior: dict, current_hash: str) -> bool:
    if prior.get("original_hash") != current_hash:
        return False
    if prior.get("mode") != "error":
        return False
    last_error_at = parse_iso8601(prior.get("processed_at"))
    if last_error_at is None:
        return False
    return utc_now() - last_error_at < timedelta(hours=ERROR_COOLDOWN_HOURS)


def process_memories(
    limit: int,
    hours: int,
    apply_changes: bool,
    verbose: bool,
    reprocess_processed: bool,
) -> int:
    anon_key = get_stash("supabase-primary-anon")
    gemini_key = get_stash("gemini-api-key")
    service_role_key = get_stash("supabase-primary-service-role") if apply_changes else ""
    state = load_state()
    processed = state.setdefault("processed", {})

    memories = fetch_recent_memories(limit, hours, anon_key)
    changed = 0
    candidates = 0
    log(
        f"scan-start version={VERSION} mode={'apply' if apply_changes else 'dry-run'} "
        f"limit={limit} hours={hours} rows={len(memories)}"
    )

    for memory in memories:
        memory_id = memory["id"]
        content = memory.get("content", "")
        current_hash = content_hash(content)
        prior = processed.get(memory_id, {})
        if should_back_off(prior, current_hash):
            if verbose:
                print(f"cooldown {memory_id} last_error_at={prior.get('processed_at')}")
            continue
        if apply_changes and prior.get("mode") == "apply" and not reprocess_processed:
            if verbose:
                print(f"skip {memory_id} already processed at {prior.get('processed_at')}")
            continue
        if current_hash in {prior.get("original_hash"), prior.get("distilled_hash")}:
            continue
        if not should_distill(memory):
            continue

        candidates += 1
        if verbose:
            print(
                f"candidate {memory_id} importance={memory.get('importance')} "
                f"score={technical_score(memory)} markers={execution_marker_score(content)}"
            )

        try:
            distilled = distill_with_gemini(content, gemini_key)
            distilled_hash = content_hash(distilled)
            if apply_changes:
                if distilled_hash == current_hash:
                    processed[memory_id] = {
                        "original_hash": current_hash,
                        "distilled_hash": distilled_hash,
                        "processed_at": utc_now().isoformat(),
                        "mode": "noop",
                    }
                    log(f"no-op {memory_id}")
                    continue

                backup_memory(memory)
                patch_memory(memory_id, distilled, service_role_key)
                processed[memory_id] = {
                    "original_hash": current_hash,
                    "distilled_hash": distilled_hash,
                    "processed_at": utc_now().isoformat(),
                    "mode": "apply",
                }
                changed += 1
                log(f"patched {memory_id}")
            else:
                print(f"--- {memory_id} ---")
                print(distilled[:1200])
                print()
        except Exception as exc:
            processed[memory_id] = {
                "original_hash": current_hash,
                "distilled_hash": prior.get("distilled_hash"),
                "processed_at": utc_now().isoformat(),
                "mode": "error",
                "error": str(exc)[:500],
            }
            log(f"error {memory_id} {exc}")
            if verbose:
                print(f"error {memory_id}: {exc}", file=sys.stderr)

    save_state(state)
    log(
        f"scan-complete version={VERSION} mode={'apply' if apply_changes else 'dry-run'} "
        f"candidates={candidates} changed={changed}"
    )
    return changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Patch qualifying memories")
    parser.add_argument("--limit", type=int, default=20, help="Recent row limit")
    parser.add_argument("--hours", type=int, default=72, help="Recent window in hours")
    parser.add_argument("--verbose", action="store_true", help="Print candidate diagnostics")
    parser.add_argument(
        "--reprocess-processed",
        action="store_true",
        help="Allow rows already marked as applied in state.json to be reconsidered",
    )
    args = parser.parse_args()

    lock_handle = acquire_lock()
    if lock_handle is None:
        log("lock-busy exiting")
        print("memory-distiller skipped: another run is active")
        return 0

    try:
        changed = process_memories(
            args.limit,
            args.hours,
            args.apply,
            args.verbose,
            args.reprocess_processed,
        )
    finally:
        lock_handle.close()
    mode = "apply" if args.apply else "dry-run"
    print(f"memory-distiller complete mode={mode} changed={changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
