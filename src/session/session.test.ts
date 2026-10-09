import { expect, test } from 'bun:test';

import { createSession } from './session.ts';

test('getSnapshot returns the same object until a transition changes it', () => {
  const session = createSession();
  const first = session.getSnapshot();

  expect(session.getSnapshot()).toBe(first);

  session.send({ kind: 'noop' });

  expect(session.getSnapshot()).not.toBe(first);
});

test('subscribers hear each transition until they unsubscribe', () => {
  const session = createSession();
  let calls = 0;

  const unsubscribe = session.subscribe(() => {
    calls += 1;
  });

  session.send({ kind: 'noop' });
  unsubscribe();
  session.send({ kind: 'noop' });

  expect(calls).toBe(1);
});

test('send after stop notifies nobody and keeps the snapshot', () => {
  const session = createSession();
  let calls = 0;

  session.subscribe(() => {
    calls += 1;
  });

  const before = session.getSnapshot();

  session.stop();
  session.send({ kind: 'noop' });

  expect(calls).toBe(0);
  expect(session.getSnapshot()).toBe(before);
});

test('subscribe after stop never notifies', () => {
  const session = createSession();
  let calls = 0;

  session.stop();

  session.subscribe(() => {
    calls += 1;
  });

  session.send({ kind: 'noop' });

  expect(calls).toBe(0);
});
