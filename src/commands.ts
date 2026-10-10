import type { ApplicationIntent, Snapshot } from './session/session.ts';

type Intent =
  | { kind: 'application'; intent: ApplicationIntent }
  | { kind: 'ui'; action: 'toggleHelp' | 'closeHelp' }
  | { kind: 'terminal'; action: 'quit' };

export type TerminalIntent = Extract<Intent, { kind: 'terminal' }>;

export interface Command {
  id: string;
  label: string;
  scope: 'global' | 'list' | 'preview' | 'modal';
  keys: readonly string[];
  disabledReason: (snapshot: Snapshot) => string | undefined;
  intent: (snapshot: Snapshot) => Intent;
}

export const catalog: readonly Command[] = [
  {
    id: 'quit',
    label: 'Quit',
    scope: 'global',
    keys: ['q', 'ctrl+c'],
    disabledReason: () => undefined,
    intent: () => ({ kind: 'terminal', action: 'quit' }),
  },
  {
    id: 'help',
    label: 'Toggle help',
    scope: 'global',
    keys: ['?'],
    disabledReason: () => undefined,
    intent: () => ({ kind: 'ui', action: 'toggleHelp' }),
  },
  {
    id: 'selectNext',
    label: 'Select next thread',
    scope: 'list',
    keys: ['j', 'down'],
    disabledReason: () => undefined,
    intent: () => ({ kind: 'application', intent: { kind: 'selectNext' } }),
  },
  {
    id: 'selectPrevious',
    label: 'Select previous thread',
    scope: 'list',
    keys: ['k', 'up'],
    disabledReason: () => undefined,
    intent: () => ({ kind: 'application', intent: { kind: 'selectPrevious' } }),
  },
  {
    id: 'refresh',
    label: 'Refresh',
    scope: 'list',
    keys: ['r'],
    disabledReason: () => undefined,
    intent: () => ({ kind: 'application', intent: { kind: 'refresh' } }),
  },
  {
    id: 'closeHelp',
    label: 'Close help',
    scope: 'modal',
    keys: ['escape'],
    disabledReason: () => undefined,
    intent: () => ({ kind: 'ui', action: 'closeHelp' }),
  },
];
