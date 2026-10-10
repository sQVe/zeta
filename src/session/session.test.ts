import { expect, test } from 'bun:test';

import type { GitHubResult } from '../github/github.ts';
import type { NotificationThread } from '../work/work.ts';
import { toThreadId } from '../work/work.ts';
import { createSession } from './session.ts';

type ThreadsResult = GitHubResult<NotificationThread[]>;

const makeThread = (
  id: string,
  overrides: Partial<NotificationThread> = {},
): NotificationThread => ({
  id: toThreadId(id),
  reason: 'review_requested',
  unread: true,
  updatedAt: '2026-01-02T10:00:00Z',
  lastReadAt: null,
  title: `Thread ${id}`,
  subjectType: 'PullRequest',
  subjectUrl: `https://api.github.com/repos/acme/app/pulls/${id}`,
  repository: 'acme/app',
  ...overrides,
});

const succeed = (...threads: NotificationThread[]): ThreadsResult => ({ ok: true, value: threads });

const settle = () => Bun.sleep(0);

const makeHarness = () => {
  const pending: { resolve: (result: ThreadsResult) => void; signal: AbortSignal }[] = [];
  const now = new Date('2026-02-01T12:00:00Z');

  const session = createSession({
    readThreads: (signal) =>
      new Promise<ThreadsResult>((resolve) => {
        pending.push({ resolve, signal });
      }),
    now: () => now,
  });

  const resolveNext = async (result: ThreadsResult) => {
    pending.shift()?.resolve(result);
    await settle();
  };

  const load = async (...threads: NotificationThread[]) => {
    session.send({ kind: 'refresh' });
    await resolveNext(succeed(...threads));
  };

  const selected = () => session.getSnapshot().selectedThreadId;

  return { session, pending, now, settle, resolveNext, load, selected };
};

test('a refresh holds the open threads in feed order and selects the first', async () => {
  const { session, pending, resolveNext, now } = makeHarness();
  const first = makeThread('1');
  const second = makeThread('2');
  const done = makeThread('3', { unread: false, lastReadAt: null });

  session.send({ kind: 'refresh' });

  expect(pending).toHaveLength(1);
  expect(session.getSnapshot().refreshStatus).toBe('running');

  await resolveNext(succeed(first, done, second));

  const snapshot = session.getSnapshot();

  expect(snapshot.threads).toEqual([first, second]);
  expect(snapshot.selectedThreadId).toBe(first.id);
  expect(snapshot.refreshStatus).toBe('idle');
  expect(snapshot.hasLoaded).toBe(true);
  expect(snapshot.refreshedAt).toEqual(now);
});

test('getSnapshot returns the same object until a transition changes it', async () => {
  const { session, load } = makeHarness();
  const first = session.getSnapshot();

  expect(session.getSnapshot()).toBe(first);

  await load(makeThread('1'));

  expect(session.getSnapshot()).not.toBe(first);
});

test('subscribers hear transitions until they unsubscribe', async () => {
  const { session, load } = makeHarness();
  let calls = 0;

  const unsubscribe = session.subscribe(() => {
    calls += 1;
  });

  await load(makeThread('1'));

  const heard = calls;

  unsubscribe();
  session.send({ kind: 'selectNext' });
  await load(makeThread('1'));

  expect(heard).toBeGreaterThan(0);
  expect(calls).toBe(heard);
});

test('a result after stop is dropped and the running refresh is aborted', async () => {
  const { session, pending, resolveNext } = makeHarness();
  let calls = 0;

  session.subscribe(() => {
    calls += 1;
  });

  session.send({ kind: 'refresh' });

  const before = session.getSnapshot();
  const signal = pending[0]?.signal;
  const callsBeforeStop = calls;

  session.stop();

  expect(signal?.aborted).toBe(true);

  await resolveNext(succeed(makeThread('1')));

  expect(session.getSnapshot()).toBe(before);
  expect(calls).toBe(callsBeforeStop);
});

test('send after stop starts no refresh and changes nothing', () => {
  const { session, pending } = makeHarness();
  const before = session.getSnapshot();

  session.stop();
  session.send({ kind: 'refresh' });

  expect(pending).toHaveLength(0);
  expect(session.getSnapshot()).toBe(before);
});

test('three refresh intents during one refresh start exactly one follow-up', async () => {
  const { session, pending, resolveNext } = makeHarness();

  session.send({ kind: 'refresh' });
  session.send({ kind: 'refresh' });
  session.send({ kind: 'refresh' });
  session.send({ kind: 'refresh' });

  expect(pending).toHaveLength(1);

  await resolveNext(succeed(makeThread('1')));

  expect(pending).toHaveLength(1);
  expect(session.getSnapshot().refreshStatus).toBe('running');

  await resolveNext(succeed(makeThread('1')));

  expect(pending).toHaveLength(0);
  expect(session.getSnapshot().refreshStatus).toBe('idle');
});

test('a failed refresh keeps the previous threads and sets the error', async () => {
  const { session, load, resolveNext } = makeHarness();
  const thread = makeThread('1');

  await load(thread);
  session.send({ kind: 'refresh' });

  await resolveNext({
    ok: false,
    failure: { kind: 'requestFailed', status: 500, message: 'Server error' },
  });

  const snapshot = session.getSnapshot();

  expect(snapshot.threads).toEqual([thread]);
  expect(snapshot.selectedThreadId).toBe(thread.id);
  expect(snapshot.errorMessage).toBe('Server error');
  expect(snapshot.notice).toBeNull();

  await load(thread);

  expect(session.getSnapshot().errorMessage).toBeNull();
});

test('a rejected read is a failed refresh and the session keeps running', async () => {
  let attempts = 0;
  const thread = makeThread('1');

  const session = createSession({
    readThreads: () => {
      attempts += 1;

      if (attempts === 1) {
        return Promise.reject(new Error('socket closed'));
      }

      return Promise.resolve(succeed(thread));
    },
    now: () => new Date('2026-02-01T12:00:00Z'),
  });

  session.send({ kind: 'refresh' });
  await Bun.sleep(0);

  expect(session.getSnapshot().errorMessage).toBe('socket closed');
  expect(session.getSnapshot().refreshStatus).toBe('idle');

  session.send({ kind: 'refresh' });
  await Bun.sleep(0);

  expect(session.getSnapshot().threads).toEqual([thread]);
  expect(session.getSnapshot().errorMessage).toBeNull();
});

test('a read that throws is a failed refresh', async () => {
  const session = createSession({
    readThreads: () => {
      throw new Error('spawn failed');
    },
    now: () => new Date('2026-02-01T12:00:00Z'),
  });

  session.send({ kind: 'refresh' });
  await Bun.sleep(0);

  expect(session.getSnapshot().errorMessage).toBe('spawn failed');
  expect(session.getSnapshot().refreshStatus).toBe('idle');
});

test('ghMissing and notSignedIn set the notice and a later success clears it', async () => {
  const { session, load, resolveNext } = makeHarness();
  const thread = makeThread('1');

  await load(thread);

  session.send({ kind: 'refresh' });
  await resolveNext({ ok: false, failure: { kind: 'ghMissing' } });

  expect(session.getSnapshot().notice).toBe('ghMissing');
  expect(session.getSnapshot().errorMessage).toBeNull();
  expect(session.getSnapshot().threads).toEqual([thread]);

  session.send({ kind: 'refresh' });
  await resolveNext({ ok: false, failure: { kind: 'notSignedIn' } });

  expect(session.getSnapshot().notice).toBe('notSignedIn');

  await load(thread);

  expect(session.getSnapshot().notice).toBeNull();
});

test('selectNext and selectPrevious move one row and stop at the ends', async () => {
  const { session, load, selected } = makeHarness();
  const [a, b, c] = [makeThread('1'), makeThread('2'), makeThread('3')] as const;

  await load(a, b, c);
  session.send({ kind: 'selectPrevious' });

  expect(selected()).toBe(a.id);

  session.send({ kind: 'selectNext' });

  expect(selected()).toBe(b.id);

  session.send({ kind: 'selectNext' });
  session.send({ kind: 'selectNext' });

  expect(selected()).toBe(c.id);

  session.send({ kind: 'selectPrevious' });

  expect(selected()).toBe(b.id);
});

test('selection stays on the same thread across a refresh that reorders threads', async () => {
  const { session, load, selected } = makeHarness();
  const [a, b, c] = [makeThread('1'), makeThread('2'), makeThread('3')] as const;

  await load(a, b, c);
  session.send({ kind: 'selectNext' });
  await load(c, b, a);

  expect(selected()).toBe(b.id);

  session.send({ kind: 'selectNext' });
  await load(b, a, c);

  expect(selected()).toBe(a.id);
});

test('when the selected thread leaves, the thread now in its row is selected', async () => {
  const { session, load, selected } = makeHarness();
  const [a, b, c] = [makeThread('1'), makeThread('2'), makeThread('3')] as const;

  await load(a, b, c);
  session.send({ kind: 'selectNext' });
  await load(a, c);

  expect(selected()).toBe(c.id);

  await load(a);

  expect(selected()).toBe(a.id);

  await load();

  expect(selected()).toBeNull();
  expect(session.getSnapshot().hasLoaded).toBe(true);

  session.send({ kind: 'selectNext' });

  expect(selected()).toBeNull();
});
