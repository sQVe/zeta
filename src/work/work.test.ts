import { expect, test } from 'bun:test';

import type { NotificationThread } from './work.ts';
import {
  isDoneOnGitHub,
  readSubjectNumber,
  selectOpenThreads,
  toThreadId,
  toViewerLogin,
} from './work.ts';

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

test('selectOpenThreads leaves out threads GitHub shows as done and keeps the rest in order', () => {
  const done = makeThread('1', { unread: false, lastReadAt: null });
  const unread = makeThread('2', { unread: true, lastReadAt: null });

  const readWithTimestamp = makeThread('3', {
    unread: false,
    lastReadAt: '2026-01-01T10:00:00Z',
  });

  const unreadWithTimestamp = makeThread('4', {
    unread: true,
    lastReadAt: '2026-01-01T10:00:00Z',
  });

  const open = selectOpenThreads([unread, done, readWithTimestamp, unreadWithTimestamp]);

  expect(open).toEqual([unread, readWithTimestamp, unreadWithTimestamp]);
});

test('selectOpenThreads keeps a thread without a subject URL', () => {
  const checkSuite = makeThread('5', { subjectType: 'CheckSuite', subjectUrl: null });

  expect(selectOpenThreads([checkSuite])).toEqual([checkSuite]);
});

test('toThreadId and toViewerLogin reject empty values', () => {
  expect(() => toThreadId('')).toThrow();
  expect(() => toViewerLogin('')).toThrow();
});

test('isDoneOnGitHub is true only for a read thread with no last read time', () => {
  expect(isDoneOnGitHub(makeThread('6', { unread: false, lastReadAt: null }))).toBe(true);
  expect(isDoneOnGitHub(makeThread('7', { unread: true, lastReadAt: null }))).toBe(false);
});

test('readSubjectNumber reads pull request and issue numbers and returns null without one', () => {
  const base = 'https://api.github.com/repos/o/r';

  expect(readSubjectNumber(`${base}/pulls/12`)).toBe(12);
  expect(readSubjectNumber(`${base}/issues/7`)).toBe(7);
  expect(readSubjectNumber(`${base}/releases/555`)).toBeNull();
  expect(readSubjectNumber(`${base}/commits/abc123def`)).toBeNull();
  expect(readSubjectNumber(null)).toBeNull();
});
