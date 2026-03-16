# Validation Pattern

## Never claim success from file existence alone
You need at least one of these:
- passing tests
- successful dry run
- successful real run
- live scheduler status
- logs/reports showing expected behavior

## Preferred validation ladder
1. **Files changed** — proves implementation landed
2. **Bootstrap works** — proves runtime is real
3. **Tests pass** — proves local correctness
4. **Dry run is sane** — proves candidate selection is sane
5. **Real run succeeds** — proves end-to-end function
6. **Scheduled run succeeds** — proves permanence

## Source-scope sanity check
After cleanup, inspect actual ingested paths.
If you still see handoffs, generated docs, or archives, the cleanup is not done.
