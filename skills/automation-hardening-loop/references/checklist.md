# Automation Hardening Checklist

## Use this exact order

1. **Confirm the existing tool actually works once**
   - find project path
   - run current command
   - note real blockers

2. **Runtime hardening**
   - add dependency manifest
   - add bootstrap/setup script
   - verify local environment creation

3. **Fallback hardening**
   - make optional providers optional
   - convert hard crashes into degraded mode
   - surface degraded reason in reports/logs

4. **Source cleanup**
   - remove generated roots from defaults
   - block handoffs/archive/report paths
   - favor session logs, transcripts, real inputs

5. **Runner wiring**
   - add wrapper script
   - add logging
   - add lock / overlap protection
   - add scheduler

6. **Validation**
   - run bootstrap
   - run tests
   - run dry-run
   - run real execution when safe
   - inspect log/report outputs directly

## Anti-drift rule
If you catch yourself redesigning the whole architecture, reset to:
> What is the minimum hardening work required to make the current tool reliable?
