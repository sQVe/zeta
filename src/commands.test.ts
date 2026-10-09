import { expect, test } from 'bun:test';

import { catalog } from './commands.ts';
import { createSession } from './session/session.ts';

const snapshot = createSession().getSnapshot();

test('quit returns a terminal intent and help returns a UI intent', () => {
  const intents = Object.fromEntries(
    catalog.map((command) => [command.id, command.intent(snapshot)]),
  );

  expect(intents['quit']).toEqual({ kind: 'terminal', action: 'quit' });
  expect(intents['help']).toEqual({ kind: 'ui', action: 'toggleHelp' });
});

test('no catalog key is bound to two commands', () => {
  const keys = catalog.flatMap((command) => command.keys);

  expect(new Set(keys).size).toBe(keys.length);
});
