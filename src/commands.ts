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
    id: 'closeHelp',
    label: 'Close help',
    scope: 'modal',
    keys: ['escape'],
    disabledReason: () => undefined,
    intent: () => ({ kind: 'ui', action: 'closeHelp' }),
  },
];
