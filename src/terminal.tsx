import { createCliRenderer } from '@opentui/core';
import type { CliRenderer } from '@opentui/core';
import { createDefaultOpenTuiKeymap } from '@opentui/keymap/opentui';
import { createRoot } from '@opentui/react';
import type { ReactNode } from 'react';

import type { Command, TerminalIntent } from './commands.ts';
import type { Session } from './session/session.ts';
import { App } from './ui/ui.tsx';
import type { AppProps, ThemeSource } from './ui/ui.tsx';

type ThemeMode = 'light' | 'dark' | null;

type ProcessEvent = 'SIGINT' | 'SIGTERM' | 'uncaughtException' | 'unhandledRejection';

export interface TerminalRenderer {
  waitForThemeMode: (timeoutMilliseconds: number) => Promise<ThemeMode>;
  on: (event: 'theme_mode', listener: (mode: ThemeMode) => void) => unknown;
  off: (event: 'theme_mode', listener: (mode: ThemeMode) => void) => unknown;
  destroy: () => void;
}

interface TerminalRoot {
  render: (node: ReactNode) => void;
  unmount: () => void;
}

export interface TerminalEffects {
  open: () => Promise<{
    renderer: TerminalRenderer;
    root: TerminalRoot;
    keymap: AppProps['keymap'];
  }>;
  listen: (event: ProcessEvent, handler: (reason?: unknown) => void) => () => void;
  exit: (code: number) => void;
  printError: (error: unknown) => void;
}

export interface TerminalDependencies {
  session: Session;
  catalog: readonly Command[];
}

const themeWaitMilliseconds = 500;

const openOpenTui = async (): Promise<{
  renderer: CliRenderer;
  root: TerminalRoot;
  keymap: AppProps['keymap'];
}> => {
  const renderer = await createCliRenderer({ exitOnCtrlC: false, exitSignals: [] });

  return {
    renderer,
    root: createRoot(renderer),
    keymap: createDefaultOpenTuiKeymap(renderer),
  };
};

const listenToProcess = (
  event: ProcessEvent,
  handler: (reason?: unknown) => void,
): (() => void) => {
  process.on(event, handler);

  return () => {
    process.off(event, handler);
  };
};

const processEffects: TerminalEffects = {
  open: openOpenTui,
  listen: listenToProcess,
  exit: (code) => process.exit(code),
  printError: (error) => {
    process.stderr.write(
      `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
    );
  },
};

export const startTerminal = async (
  dependencies: TerminalDependencies,
  effects: TerminalEffects = processEffects,
): Promise<void> => {
  const { session, catalog } = dependencies;
  const { renderer, root, keymap } = await effects.open();
  let themeMode: ThemeMode = null;
  const themeListeners = new Set<() => void>();
  let shutdownPromise: Promise<void> | undefined;
  const removers: (() => void)[] = [];

  const runShutdown = (): void => {
    try {
      session.stop();

      for (const remove of removers.splice(0)) {
        remove();
      }

      root.unmount();
      themeListeners.clear();
    } finally {
      renderer.destroy();
    }
  };

  const shutdown = (): Promise<void> => {
    shutdownPromise ??= Promise.resolve().then(runShutdown);

    return shutdownPromise;
  };

  const reportAndExit = (error: unknown): void => {
    effects.printError(error);
    effects.exit(1);
  };

  const quit = (): void => {
    shutdown()
      .then(() => {
        effects.exit(0);
      })
      .catch(reportAndExit);
  };

  const fail = (reason: unknown): void => {
    shutdown()
      .catch(() => undefined)
      .then(() => {
        reportAndExit(reason);
      })
      .catch(() => {
        effects.exit(1);
      });
  };

  const handleIntent = (_intent: TerminalIntent) => {
    quit();
  };

  const themeSource: ThemeSource = {
    getThemeMode: () => themeMode,
    subscribe: (listener) => {
      themeListeners.add(listener);

      return () => {
        themeListeners.delete(listener);
      };
    },
  };

  const onThemeMode = (mode: ThemeMode) => {
    themeMode = mode;

    for (const listener of themeListeners) {
      listener();
    }
  };

  removers.push(
    effects.listen('SIGINT', quit),
    effects.listen('SIGTERM', quit),
    effects.listen('uncaughtException', fail),
    effects.listen('unhandledRejection', fail),
  );

  try {
    themeMode = await renderer.waitForThemeMode(themeWaitMilliseconds);
    renderer.on('theme_mode', onThemeMode);
    removers.push(() => renderer.off('theme_mode', onThemeMode));

    root.render(
      <App
        session={session}
        catalog={catalog}
        keymap={keymap}
        themeSource={themeSource}
        onTerminalIntent={handleIntent}
      />,
    );
  } catch (error) {
    fail(error);
  }
};
