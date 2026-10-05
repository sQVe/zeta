# ADR 0015: Notifications first, with a batched subject lookup

- Status: Accepted
- Date: 2026-10-05

## Context

- [ADR 0012](./0012-work-sources-and-rules.md) planned notifications plus three pull request
  searches, with local rules that decide why a pull request needs action.
- After two design reviews, the user chose to ship the notification list first and prove daily value
  before building pull request work.
- In the sampled account, 29 of 39 pull request threads were on merged pull requests. The
  notification payload holds neither the subject's state nor its author.
- The user works toward inbox zero: a thread is done or not. Opening a thread in the browser marks
  it read on GitHub, which must not count as done.
- A test on 2026-10-05 showed that `GET /notifications?all=true` still returns done threads. A done
  thread that was never read shows `unread: false` and `last_read_at: null`. A thread read before it
  was marked done looks like any read thread.

## Options considered

- Keep ADR 0012. Deferred: pull request work comes after the notification list proves useful.
- No subject lookup. Rejected: threads on merged pull requests, most of the noise, look like live
  ones.
- Unread threads only, so read means done. Rejected: opening a thread would remove it.
- Show GitHub's read state beside done. Rejected: the user wants one state.
- All threads, minus those GitHub shows as done and those Zeta marked done. Chosen.

## Decision

The only source is the notifications feed, read with `all=true`. Each thread that is not done is one
item, with GitHub's notification reason. Pull request searches and reason rules are deferred.

- A thread is done when GitHub shows it as done, or when Zeta marked it done and its `updated_at`
  has not changed since. Zeta saves that record in local state under
  [ADR 0018](./0018-local-state-and-config.md).
- Done is the only action, on one thread or a group. Zeta sends it after a short delay so undo can
  cancel it, because the API cannot return a thread to the inbox. Dismiss, mark read, and
  unsubscribe are dropped.
- For pull request and issue threads, Zeta looks up state and author in batched GraphQL requests,
  only for new or changed threads. A failed lookup leaves the fact unknown, and an unknown fact
  never hides a thread.
- `work` owns the facts type, and only `github` sees GitHub's response shapes.

## Tradeoffs

- One source and no reason rules make the first version much smaller.
- Opening a thread never removes it.
- Cost: pull request work without a notification, such as a failed check on the user's own pull
  request, does not show.
- Cost: done detection relies on undocumented fields.
- Cost: a thread read and then marked done outside Zeta stays until it is marked done in Zeta.
- Cost: `all=true` is larger than the unread feed: 362 threads against 81 in the sampled account.

## See also

- [ADR 0016: A SQLite snapshot with a checked full refresh](./0016-snapshot-and-full-refresh.md)
- [GitHub notifications API](https://docs.github.com/en/rest/activity/notifications)
