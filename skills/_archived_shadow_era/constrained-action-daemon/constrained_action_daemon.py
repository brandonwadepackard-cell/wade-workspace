#!/usr/bin/env python3
import os, sys, time, subprocess, select, json, urllib.request

LOG_FILE = "/Users/brandonpackard/.openclaw/logs/gateway.err.log"
POLL_INTERVAL = 2.0  
TIMEOUT_SECONDS = 30 

def get_api_key():
    import subprocess
    cmd = ['security', 'find-generic-password', '-a', 'brandonpackard', '-s', 'stash.gemini-api-key', '-w']
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.stdout.strip()

api_key = get_api_key()

def generate_bash_fix(error_text):
    """Hits the Gemini API to get a pure bash fix. Strips all markdown."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    data = {"contents": [{"parts": [{"text": f"Output ONLY ONE raw bash command to cure this error. NO MARKDOWN.\n\nERROR:\n{error_text}"}]}]}
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode())
            text = res_body['candidates'][0]['content']['parts'][0]['text']
            # Strip markdown if any
            if text.startswith("```bash"): text = text[7:]
            elif text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            return text.strip()
    except Exception as e:
        return f"echo 'CAD Error resolving fix: {e}'"

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
if not os.path.exists(LOG_FILE):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    open(LOG_FILE, 'w').close()
last_size = os.path.getsize(LOG_FILE)
print(f"[CAD] Monitoring {LOG_FILE}...")
while True:
    time.sleep(POLL_INTERVAL)
    current_size = os.path.getsize(LOG_FILE)
    if current_size > last_size:
        with open(LOG_FILE, 'r') as f:
            f.seek(last_size)
            new_error = f.read().strip()
        last_size = current_size
        if new_error:
            fix_cmd = generate_bash_fix(new_error)
            execute_with_constraint(fix_cmd)
