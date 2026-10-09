import { expect, test } from 'bun:test';

import type { ReactElement } from 'react';

import { catalog } from './commands.ts';
import { createSession } from './session/session.ts';
import { startTerminal } from './terminal.tsx';
import type { TerminalEffects, TerminalRenderer } from './terminal.tsx';
import type { AppProps } from './ui/ui.tsx';

type ThemeMode = 'light' | 'dark' | null;
type ThemeListener = (mode: ThemeMode) => void;

const createHarness = (initialTheme: ThemeMode) => {
  const listeners = new Set<ThemeListener>();
  const handlers = new Map<string, (reason?: unknown) => void>();
  const rendered: ReactElement<{ themeSource: { getThemeMode: () => ThemeMode } }>[] = [];
  const exitCodes: number[] = [];
  const printed: unknown[] = [];
  const calls = { destroy: 0, unmount: 0 };

  const renderer: TerminalRenderer = {
    waitForThemeMode: () => Promise.resolve(initialTheme),
    on: (_event, listener) => listeners.add(listener),
    off: (_event, listener) => listeners.delete(listener),
    destroy: () => {
      calls.destroy += 1;
    },
  };

  const effects: TerminalEffects = {
    open: () =>
      Promise.resolve({
        renderer,
        keymap: {} as AppProps['keymap'],
        root: {
          render: (node) =>
            rendered.push(node as ReactElement<{ themeSource: { getThemeMode: () => ThemeMode } }>),
          unmount: () => {
            calls.unmount += 1;
          },
        },
      }),
    listen: (event, handler) => {
      handlers.set(event, handler);

      return () => handlers.delete(event);
    },
    exit: (code) => exitCodes.push(code),
    printError: (error) => printed.push(error),
  };

  const session = createSession();
  const latestTheme = () => rendered.at(-1)?.props.themeSource.getThemeMode() ?? null;

  return {
    effects,
    session,
    handlers,
    listeners,
    rendered,
    exitCodes,
    printed,
    calls,
    latestTheme,
  };
};

const settle = () => Bun.sleep(10);

test('a second shutdown destroys the renderer once and changes nothing more', async () => {
  const harness = createHarness('dark');

  await startTerminal({ session: harness.session, catalog }, harness.effects);

  const sigint = harness.handlers.get('SIGINT');
  const sigterm = harness.handlers.get('SIGTERM');

  sigint?.();
  sigterm?.();
  await settle();

  expect(harness.calls).toEqual({ destroy: 1, unmount: 1 });
  expect(harness.exitCodes).toEqual([0, 0]);
  expect(harness.handlers.size).toBe(0);
  expect(harness.listeners.size).toBe(0);
});

test('a fatal error destroys the renderer before it prints and exits non-zero', async () => {
  const harness = createHarness('dark');
  const order: string[] = [];

  await startTerminal({ session: harness.session, catalog }, harness.effects);

  const failure = new Error('boom');
  const original = harness.effects.printError;

  harness.effects.printError = (error) => {
    order.push(`print:${harness.calls.destroy}`);
    original(error);
  };

  harness.handlers.get('uncaughtException')?.(failure);
  await settle();

  expect(order).toEqual(['print:1']);
  expect(harness.printed).toEqual([failure]);
  expect(harness.exitCodes).toEqual([1]);
});

test('the renderer theme reaches the UI and later changes follow', async () => {
  const harness = createHarness('light');

  await startTerminal({ session: harness.session, catalog }, harness.effects);

  expect(harness.latestTheme()).toBe('light');

  for (const listener of harness.listeners) {
    listener('dark');
  }

  expect(harness.latestTheme()).toBe('dark');
  expect(harness.rendered).toHaveLength(1);
});

test('an unknown theme gives the dark palette', async () => {
  const harness = createHarness(null);

  await startTerminal({ session: harness.session, catalog }, harness.effects);

  expect(harness.latestTheme()).toBeNull();
});
