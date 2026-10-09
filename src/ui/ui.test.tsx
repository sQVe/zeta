import { afterEach, expect, test } from 'bun:test';

import { RGBA } from '@opentui/core';
import { createDefaultOpenTuiKeymap } from '@opentui/keymap/opentui';
import { useRenderer } from '@opentui/react';
import { testRender } from '@opentui/react/test-utils';
import { act, useMemo } from 'react';
import type { ReactNode } from 'react';

import { catalog } from '../commands.ts';
import type { TerminalIntent } from '../commands.ts';
import { createSession } from '../session/session.ts';
import { pickPalette } from './palette.ts';
import { App } from './ui.tsx';
import type { AppProps } from './ui.tsx';

type Setup = Awaited<ReturnType<typeof testRender>>;

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);

const setups: Setup[] = [];

afterEach(() => {
  for (const setup of setups.splice(0)) {
    act(() => {
      setup.renderer.destroy();
    });
  }
});

const WithKeymap = (props: Omit<AppProps, 'keymap'>): ReactNode => {
  const renderer = useRenderer();
  const keymap = useMemo(() => createDefaultOpenTuiKeymap(renderer), [renderer]);

  return <App {...props} keymap={keymap} />;
};

const mount = async (initialMode: 'light' | 'dark' | null = null) => {
  let themeMode = initialMode;
  const themeListeners = new Set<() => void>();

  const themeSource = {
    getThemeMode: () => themeMode,
    subscribe: (listener: () => void) => {
      themeListeners.add(listener);

      return () => themeListeners.delete(listener);
    },
  };

  const changeTheme = async (mode: 'light' | 'dark' | null) => {
    themeMode = mode;

    await act(async () => {
      for (const listener of themeListeners) {
        listener();
      }
    });
  };

  const session = createSession();
  let sessionSubscribers = 0;
  const subscribe = session.subscribe;

  session.subscribe = (listener) => {
    sessionSubscribers += 1;

    const unsubscribe = subscribe(listener);

    return () => {
      sessionSubscribers -= 1;
      unsubscribe();
    };
  };

  const terminalIntents: TerminalIntent[] = [];
  const sent: unknown[] = [];
  const send = session.send;

  session.send = (intent) => {
    sent.push(intent);
    send(intent);
  };

  const node: ReactNode = (
    <WithKeymap
      session={session}
      catalog={catalog}
      themeSource={themeSource}
      onTerminalIntent={(intent) => terminalIntents.push(intent)}
    />
  );

  const setup = await act(() => testRender(node, { width: 60, height: 20 }));

  setups.push(setup);

  const settle = () =>
    act(async () => {
      await Bun.sleep(50);
      await setup.renderOnce();
    });

  const press = async (key: string) => {
    await act(async () => {
      if (key === 'escape') {
        setup.mockInput.pressEscape();
      } else {
        setup.mockInput.pressKey(key);
      }
    });

    await settle();
    await settle();
  };

  await settle();

  return {
    setup,
    press,
    settle,
    changeTheme,
    terminalIntents,
    sent,
    subscriberCount: () => sessionSubscribers,
  };
};

test('? opens the overlay with every command label and ? closes it', async () => {
  const { setup, press } = await mount();

  await press('?');

  const open = setup.captureCharFrame();

  for (const command of catalog) {
    expect(open).toContain(command.label);
  }

  await press('?');

  const closed = setup.captureCharFrame();

  for (const command of catalog) {
    expect(closed).not.toContain(command.label);
  }
});

test('Escape closes the overlay', async () => {
  const { setup, press } = await mount();

  await press('?');
  await press('escape');

  expect(setup.captureCharFrame()).not.toContain('Toggle help');
});

test('the status line shows ? help', async () => {
  const { setup } = await mount();

  expect(setup.captureCharFrame()).toContain('? help');
});

test('q passes a quit terminal intent and sends nothing to the session', async () => {
  const { press, terminalIntents, sent } = await mount();

  await press('q');

  expect(terminalIntents).toEqual([{ kind: 'terminal', action: 'quit' }]);
  expect(sent).toEqual([]);
});

test('q still quits while the overlay is open', async () => {
  const { press, terminalIntents } = await mount();

  await press('?');
  await press('q');

  expect(terminalIntents).toEqual([{ kind: 'terminal', action: 'quit' }]);
});

const colorOf = (mode: 'light' | 'dark'): string => RGBA.fromHex(pickPalette(mode).dim).toString();

const statusLineColor = (setup: Setup): string | undefined => {
  const spans = setup.captureSpans().lines.flatMap((line) => line.spans);
  const span = spans.find((candidate) => candidate.text.includes('? help'));

  return span?.fg.toString();
};

test('the status line color follows the theme mode, and dark when it is unknown', async () => {
  const light = await mount('light');
  const dark = await mount('dark');
  const unknown = await mount(null);

  expect(statusLineColor(light.setup)).toBe(colorOf('light'));
  expect(statusLineColor(dark.setup)).toBe(colorOf('dark'));
  expect(statusLineColor(unknown.setup)).toBe(colorOf('dark'));
});

test('ctrl+c passes a quit terminal intent', async () => {
  const { setup, terminalIntents, settle } = await mount();

  await act(async () => {
    setup.mockInput.pressKey('c', { ctrl: true });
  });

  await settle();

  expect(terminalIntents).toEqual([{ kind: 'terminal', action: 'quit' }]);
});

test('escape does nothing while the overlay is closed', async () => {
  const { setup, press } = await mount();

  await press('escape');

  expect(setup.captureCharFrame()).not.toContain('Close help');
});

test('the overlay lists the close help command from the catalog', async () => {
  const { setup, press } = await mount();

  await press('?');

  expect(setup.captureCharFrame()).toContain('Close help');
});

test('a theme change keeps the overlay open, recolors it, and adds no subscriber', async () => {
  const { setup, press, settle, changeTheme, subscriberCount } = await mount('dark');

  await press('?');

  const before = subscriberCount();

  await changeTheme('light');
  await settle();

  expect(setup.captureCharFrame()).toContain('Toggle help');
  expect(statusLineColor(setup)).toBe(colorOf('light'));
  expect(subscriberCount()).toBe(before);
  expect(before).toBe(1);

  await press('escape');

  expect(setup.captureCharFrame()).not.toContain('Toggle help');
});
