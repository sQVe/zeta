import { expect, test } from 'bun:test';

import type { NotificationThread } from '../work/work.ts';
import { toThreadId, toViewerLogin } from '../work/work.ts';
import type { GhRun } from './ghApi.ts';
import type { GitHubEffects, GitHubFailure } from './github.ts';
import { readNotificationThreads, readViewer } from './github.ts';

const signal = new AbortController().signal;

const firstUrl = '/notifications?all=true&per_page=50';
const secondUrl = 'https://api.github.com/notifications?all=true&per_page=50&page=2';
const thirdUrl = 'https://api.github.com/notifications?all=true&per_page=50&page=3';

const page = (body: unknown, next?: string): GhRun => {
  const link = next === undefined ? '' : `Link: <${next}>; rel="next"\r\n`;

  return {
    kind: 'exited',
    exitCode: 0,
    stdout: `HTTP/2.0 200 OK\r\n${link}\r\n${JSON.stringify(body)}`,
    stderr: '',
  };
};

const failedPage: GhRun = {
  kind: 'exited',
  exitCode: 1,
  stdout: 'HTTP/2.0 500 Internal Server Error\r\n\r\n{"message":"Boom"}',
  stderr: '',
};

const makeEffects = (pages: Record<string, GhRun>) => {
  const endpoints: string[] = [];

  const effects: GitHubEffects = {
    runGh: async (args) => {
      const endpoint = args.at(-1) ?? '';
      endpoints.push(endpoint);

      return pages[endpoint] ?? failedPage;
    },
    now: () => new Date('2026-01-01T00:00:00Z'),
  };

  return { effects, endpoints };
};

const rawThread = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  unread: true,
  reason: 'review_requested',
  updated_at: '2026-01-02T03:04:05Z',
  last_read_at: null,
  subject: {
    title: `Change ${id}`,
    type: 'PullRequest',
    url: `https://api.github.com/repos/octo/widgets/pulls/${id}`,
  },
  repository: { full_name: 'octo/widgets', private: false },
  ...overrides,
});

const expectedThread = (id: string): NotificationThread => ({
  id: toThreadId(id),
  reason: 'review_requested',
  unread: true,
  updatedAt: '2026-01-02T03:04:05Z',
  lastReadAt: null,
  title: `Change ${id}`,
  subjectType: 'PullRequest',
  subjectUrl: `https://api.github.com/repos/octo/widgets/pulls/${id}`,
  repository: 'octo/widgets',
});

test('readNotificationThreads follows every next link and returns all threads in order', async () => {
  const { effects, endpoints } = makeEffects({
    [firstUrl]: page([rawThread('101'), rawThread('102')], secondUrl),
    [secondUrl]: page([rawThread('103')], thirdUrl),
    [thirdUrl]: page([rawThread('104')]),
  });

  const result = await readNotificationThreads(effects, signal);

  expect(result).toEqual({
    ok: true,
    value: [
      expectedThread('101'),
      expectedThread('102'),
      expectedThread('103'),
      expectedThread('104'),
    ],
  });

  expect(endpoints).toEqual([firstUrl, secondUrl, thirdUrl]);
});

test('readNotificationThreads parses a thread with a null subject url', async () => {
  const checkSuite = rawThread('201', {
    subject: { title: 'Run failed', type: 'CheckSuite', url: null },
    last_read_at: '2026-01-02T00:00:00Z',
  });

  const { effects } = makeEffects({ [firstUrl]: page([checkSuite]) });

  const result = await readNotificationThreads(effects, signal);

  expect(result).toEqual({
    ok: true,
    value: [
      {
        ...expectedThread('201'),
        title: 'Run failed',
        subjectType: 'CheckSuite',
        subjectUrl: null,
        lastReadAt: '2026-01-02T00:00:00Z',
      },
    ],
  });
});

test('readNotificationThreads returns the failure of page 2 and no threads', async () => {
  const { effects, endpoints } = makeEffects({
    [firstUrl]: page([rawThread('101')], secondUrl),
    [secondUrl]: failedPage,
  });

  const result = await readNotificationThreads(effects, signal);

  const failure: GitHubFailure = { kind: 'requestFailed', status: 500, message: 'Boom' };

  expect(result).toEqual({ ok: false, failure });

  expect(endpoints).toEqual([firstUrl, secondUrl]);
});

test('readNotificationThreads returns invalidResponse for a thread without id', async () => {
  const { id: _id, ...withoutId } = rawThread('301');
  const { effects } = makeEffects({ [firstUrl]: page([withoutId]) });

  const result = await readNotificationThreads(effects, signal);

  expect(result.ok).toBe(false);
  expect(!result.ok && result.failure.kind).toBe('invalidResponse');
});

test('readNotificationThreads returns invalidResponse for an empty id', async () => {
  const { effects } = makeEffects({ [firstUrl]: page([rawThread('')]) });

  const result = await readNotificationThreads(effects, signal);

  expect(!result.ok && result.failure.kind).toBe('invalidResponse');
});

test('readViewer reads the login from /user', async () => {
  const { effects, endpoints } = makeEffects({ '/user': page({ login: 'octocat', id: 1 }) });

  const result = await readViewer(effects, signal);

  expect(result).toEqual({ ok: true, value: toViewerLogin('octocat') });
  expect(endpoints).toEqual(['/user']);
});

test('readViewer returns invalidResponse for a body without login', async () => {
  const { effects } = makeEffects({ '/user': page({ id: 1 }) });

  const result = await readViewer(effects, signal);

  expect(!result.ok && result.failure.kind).toBe('invalidResponse');
});

test('readViewer returns invalidResponse for an empty login', async () => {
  const { effects } = makeEffects({ '/user': page({ login: '' }) });

  const result = await readViewer(effects, signal);

  expect(!result.ok && result.failure.kind).toBe('invalidResponse');
});
