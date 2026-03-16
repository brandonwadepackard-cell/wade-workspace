# Examples

## Real example from 2026-03-16
### Conversation intelligence pipeline
**Problem:** A real pipeline existed, but it was fragile, partially manual, and scanning the wrong sources.

**Hardening moves:**
1. Added runtime stability (`requirements.txt`, `bootstrap.sh`, `.venv`)
2. Made Anthropic optional with degraded fallback
3. Removed `HANDOFFS` from default scan roots and blocked generated paths
4. Added wrapper + launchd schedule for 3x daily runs
5. Verified with tests, dry-run, live run, and scheduler status

**Outcome:** permanent automated pipeline with source cleanup and overlap protection.

## Trigger phrases
- "make this automation actually reliable"
- "don’t redesign it, just harden it"
- "this works once but breaks in production"
- "wire this to run on a schedule"
- "stop it from ingesting its own outputs"

## Adjacent use cases
- recurring scrapers that keep poisoning themselves with generated reports
- voice memo ingestion jobs
- email or calendar automations that need lock files and validation
- launchd/cron jobs that run but are not trustworthy yet
