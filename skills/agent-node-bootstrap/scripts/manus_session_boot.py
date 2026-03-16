#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import time
from datetime import datetime, timezone
from typing import Any

import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://rjcoeoropwvqzvinopze.supabase.co/rest/v1")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
AGENT_ID = os.environ.get("AGENT_ID", "manus")
HEARTBEAT_SECONDS = int(os.environ.get("HEARTBEAT_SECONDS", "300"))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def log(msg: str) -> None:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def headers() -> dict[str, str]:
    if not SUPABASE_SERVICE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY is required")
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def request_json(method: str, endpoint: str, *, params: dict[str, str] | None = None, payload: Any = None) -> Any:
    url = f"{SUPABASE_URL}{endpoint}"
    resp = requests.request(method, url, headers=headers(), params=params, json=payload, timeout=20)
    if resp.status_code >= 400:
        raise RuntimeError(f"{method} {url} -> {resp.status_code}: {resp.text[:500]}")
    if not resp.text:
        return None
    return resp.json()


def get_recent_memories(limit: int = 10) -> list[dict[str, Any]]:
    return request_json("GET", "/manus_memories", params={"select": "*", "order": "created_at.desc", "limit": str(limit)}) or []


def get_unread_messages(limit: int = 25) -> list[dict[str, Any]]:
    return request_json("GET", "/agent_messages", params={"select": "*", "to_agent": f"eq.{AGENT_ID}", "read_at": "is.null", "order": "created_at.desc", "limit": str(limit)}) or []


def get_queued_tasks() -> list[dict[str, Any]]:
    try:
        return request_json("GET", "/manus_cursor_workspace", params={"select": "*", "status": "eq.queued", "assigned_to": f"eq.{AGENT_ID}", "order": "created_at.asc"}) or []
    except Exception as exc:
        log(f"assigned_to filter failed, retrying broader queued query: {exc}")
        return request_json("GET", "/manus_cursor_workspace", params={"select": "*", "status": "eq.queued", "order": "created_at.asc"}) or []


def patch_registry_active() -> None:
    request_json("PATCH", "/agent_registry", params={"agent_id": f"eq.{AGENT_ID}"}, payload={"status": "active", "last_heartbeat": now_iso()})


def boot_sequence() -> dict[str, Any]:
    log("Starting agent boot sequence")
    memories = get_recent_memories(limit=10)
    messages = get_unread_messages(limit=25)
    tasks = get_queued_tasks()
    patch_registry_active()
    summary = {
        "memories_count": len(memories),
        "unread_messages_count": len(messages),
        "queued_tasks_count": len(tasks),
        "top_message_subjects": [m.get("subject", "") for m in messages[:5]],
        "top_task_titles": [t.get("title") or t.get("task_type") or t.get("description") or "untitled" for t in tasks[:5]],
    }
    print(json.dumps(summary, indent=2))
    return summary


def heartbeat_loop() -> None:
    log(f"Starting heartbeat loop every {HEARTBEAT_SECONDS} seconds")
    while True:
        try:
            patch_registry_active()
            log("Heartbeat sent")
        except Exception as exc:
            log(f"Heartbeat failed: {exc}")
        time.sleep(HEARTBEAT_SECONDS)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--boot", action="store_true")
    parser.add_argument("--daemon", action="store_true")
    parser.add_argument("--both", action="store_true")
    args = parser.parse_args()
    if not (args.boot or args.daemon or args.both):
        parser.error("use --boot, --daemon, or --both")
    if args.boot:
        boot_sequence()
        return 0
    if args.daemon:
        heartbeat_loop()
        return 0
    if args.both:
        boot_sequence()
        heartbeat_loop()
        return 0
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
