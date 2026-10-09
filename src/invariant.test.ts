import { expect, test } from 'bun:test';

import { invariant } from './invariant.ts';

test('invariant throws the message when the condition is false', () => {
  expect(() => {
    invariant(false, 'broken');
  }).toThrow('broken');
});

test('invariant returns when the condition is true', () => {
  expect(() => {
    invariant(true, 'broken');
  }).not.toThrow();
});
