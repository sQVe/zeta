# ADR 0018: Local state for two Zeta processes

- Status: Accepted
- Date: 2026-10-05

## Context

- [ADR 0009](./0009-local-state-and-config.md) set the rules for config and state files. It assumed
  one Zeta process per user, and saved dismissals, which Zeta no longer has.
- Zeta now saves the "new" markers, the chosen grouping, and the record of threads it marked done.
  See [ADR 0015](./0015-notifications-first.md).
- Zeta can run as an always-open pane and as a quick check at once, so two processes can write one
  state file.

## Options considered

- Keep ADR 0009. Rejected: it rules out a second writer.
- Locks or merging between writers. Deferred: a lost entry costs a marker, the grouping, or one more
  done.
- TOML for config. Deferred: it helps long queries in saved views, which are not in the first
  version.
- Keep the file rules of ADR 0009 and accept a second writer. Chosen.

## Decision

Two Zeta processes may write the same state file. The last write wins.

- The file rules of ADR 0009 stay: versioned JSON in `config.json` and `state.json`, one parser per
  file, atomic writes, migrations, and a stop on a newer version.
- Where ADR 0009 names dismissals, read saved local state.

## Tradeoffs

- Saved state keeps ADR 0009's protection against crashes and corrupt files.
- Cost: two processes can lose each other's markers, grouping, or done entries, so a thread already
  marked done can show again.

## See also

- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/)
