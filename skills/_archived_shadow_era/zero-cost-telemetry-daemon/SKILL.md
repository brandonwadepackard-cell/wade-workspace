---
name: Zero-Cost Telemetry Daemon
description: Deploy an OS-native background screen recording daemon using Unix Named Pipes to achieve 0.00% CPU utilization and 0 API token cost.
---

# THE ZERO-COST TELEMETRY DAEMON

## The Objective
To execute infinitely scalable, high-resolution screen surveillance without burning API context vectors or LLM inference credits. The Swarm must leverage native host OS capabilities instead of inefficient conversational stream-ingestion loops.

## The Exploit
Streaming screen frames into an LLM context window in real-time is a catastrophic token-sink. Our exploit completely bypasses the orchestration layer. We execute `screencapture -v` locally on the host macOS terminal wrapped inside a Python Named Pipe. The AI goes to sleep. The native macOS Silicon handles the heavy video encoding locally. 

The API cost to record a 10-hour work session becomes exactly `$0.00`.

## The Python Daemon Blueprint (`shadow_telemetry.py`)
We DO NOT use `time.sleep()` for polling, and we NEVER use raw `SIGTERM` kill-shots via the execution layer, because abrupt termination shatters macOS video buffers before the `.mov` metadata is explicitly finalized by the OS.

Instead, we use a Unix Named Pipe (FIFO) and a gracefully injected `SIGINT` intercept:

```python
import os, sys, signal, subprocess, threading

def handle_pipe(pipe_path, proc, log_file):
    try:
        # ZERO-CPU BLOCKING: This thread sleeps inside the OS kernel until triggered.
        with open(pipe_path, 'r') as fifo:
            if "STOP" in fifo.read().upper():
                log_file.write(f"Initiating graceful SIGINT shutdown...\n")
                log_file.flush()
                proc.send_signal(signal.SIGINT) # Graceful Apple encoding
    except Exception as e:
        log_file.write(f"Pipe collapsed: {e}\n")

def main():
    output_file = sys.argv[1]
    pipe_path = output_file + ".pipe"
    log_path = output_file + ".log"
    
    if os.path.exists(pipe_path): os.remove(pipe_path)
    os.mkfifo(pipe_path)
    
    with open(log_path, 'w') as log_file:
        proc = subprocess.Popen(
            ["screencapture", "-v", output_file],
            stdout=log_file, stderr=subprocess.STDOUT
        )
        
        # Isolate the async pipe listener
        threading.Thread(target=handle_pipe, args=(pipe_path, proc, log_file), daemon=True).start()
        
        proc.wait() # Blocking wait on main thread until the Subprocess signals closed.
        
    if os.path.exists(pipe_path): os.remove(pipe_path)

if __name__ == "__main__":
    main()
```

## The Execution & Teardown 
1. **Launch**: `run_command` with payload `python3 shadow_telemetry.py /tmp/target_video.mov`
2. **The Wait**: The Daemon is completely asleep asynchronously waiting on the Named Pipe.
3. **The Trigger**: The operator explicitly launches `echo "STOP" > /tmp/target_video.mov.pipe` via Terminal.
4. **The Graceful Shutdown**: The listener awakens perfectly, intercepts the text trigger, and injects exactly one `SIGINT` (Ctrl+C). `screencapture` ends cleanly. The massive 4K video file is physically dropped to disk without corruption.
