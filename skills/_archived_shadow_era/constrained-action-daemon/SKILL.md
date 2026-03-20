---
name: Constrained Action Daemon Protocol (CAD)
description: A methodology to eliminate agent UI chats by implementing localized OS-level daemon polling and gated executable inference.
---

# SKILL: CONSTRAINED ACTION DAEMON (CAD)

## Purpose
This skill teaches agents to transcend the limitations of the Chat GUI. Instead of waiting for a human to manually copy-paste an error log into a chat box, the agent deploys a native background daemon that infers fixes in real-time and physically halts the OS to ask for execution permission.

## Core Theory
Conversational interfaces encourage "State Masking" and hallucination because the agent is separated from the data layer. By deploying an OS-level polling script (the CAD), you force the LLM to operate exclusively on physical data-layer logs and output structural bash fixes. 

### The Protocol Constraints:
1. **The Polling Trigger:** The agent does not prompt the user. The daemon physically tails the target file (like `gateway.err.log`). 
2. **The Output Mandate:** The LLM is forced to return **exactly one** raw, executable bash command. No markdown, no conversation.
3. **The Gating Mechanism (Crucial):** It is absolutely forbidden to execute the bash command blindly. Autonomous execution is indistinguishable from malware. The daemon must pause and utilize `sys.stdin` to demand a physical `[Y/N]` terminal keystroke from the human operator.
4. **The Safe Abort:** If no human presses a key within 30 seconds, the daemon must auto-abort. 

## Python Exploitation Script Template

```python
#!/usr/bin/env python3
import os, sys, time, subprocess, select, json, urllib.request

LOG_FILE = "/var/log/your_target.log"
POLL_INTERVAL = 2.0  
TIMEOUT_SECONDS = 30 

# [AGENT MUST INJECT KEY RETRIEVAL HERE]
api_key = "YOUR_API_KEY"

def generate_bash_fix(error_text):
    """Hits the Gemini API to get a pure bash fix. Strips all markdown."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    prompt = f"Output ONLY ONE raw bash command to cure this error. NO MARKDOWN.\n\nERROR:\n{error_text}"
    # [EXECUTE REST REQUEST & EXTRACT COMMAND]
    return "kill $(lsof -t -i :3000)" # Example

def execute_with_constraint(bash_cmd):
    """The Gating Mechanism"""
    print(f"\n[CAD] PROPOSED FIX:\n>  {bash_cmd}")
    print(f"[CAD] EXECUTE COMMAND? [Y/N] (Auto-abort {TIMEOUT_SECONDS}s): ", end="", flush=True)

    i, o, e = select.select([sys.stdin], [], [], TIMEOUT_SECONDS)
    if i and sys.stdin.readline().strip().upper() == 'Y':
        print("[CAD] ACCESS GRANTED.")
        subprocess.run(bash_cmd, shell=True)
    else:
        print("[CAD] ACCESS DENIED / TIMEOUT.")

# Main polling loop
last_size = os.path.getsize(LOG_FILE)
while True:
    time.sleep(POLL_INTERVAL)
    current_size = os.path.getsize(LOG_FILE)
    if current_size > last_size:
        with open(LOG_FILE, 'r') as f:
            f.seek(last_size)
            new_error = f.read().strip()
        last_size = current_size
        
        fix_cmd = generate_bash_fix(new_error)
        execute_with_constraint(fix_cmd)
```

## When to use this skill
- When an objective requires a persistent script to monitor a brittle or crashing ecosystem (e.g., node servers repeatedly failing, Docker containers crashing).
- When the human operator asks you to "watch a log for errors and fix it."
- When establishing a zero-UI interaction paradigm for advanced Swarm testing.
