import type { GitHubResult } from '../github/github.ts';
import type { NotificationThread } from '../work/work.ts';
import type { Snapshot } from './sessionState.ts';
import {
  applyFailure,
  applyThreads,
  initialSnapshot,
  moveSelection,
  startRefresh,
} from './sessionState.ts';

export type { Snapshot } from './sessionState.ts';

export type ApplicationIntent =
  | { kind: 'refresh' }
  | { kind: 'selectNext' }
  | { kind: 'selectPrevious' };

export interface SessionEffects {
  readThreads: (signal: AbortSignal) => Promise<GitHubResult<NotificationThread[]>>;
  now: () => Date;
}

export interface Session {
  getSnapshot: () => Snapshot;
  subscribe: (listener: () => void) => () => void;
  send: (intent: ApplicationIntent) => void;
  stop: () => void;
}

export const createSession = (effects: SessionEffects): Session => {
  const listeners = new Set<() => void>();
  let snapshot: Snapshot = initialSnapshot;
  let stopped = false;
  let generation = 0;
  let controller: AbortController | null = null;
  let followUpPending = false;

  const getSnapshot = () => snapshot;

  const subscribe = (listener: () => void) => {
    if (stopped) {
      return () => undefined;
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const update = (next: Snapshot) => {
    if (next === snapshot) {
      return;
    }

    snapshot = next;

    for (const listener of listeners) {
      listener();
    }
  };

  const readThreads = async (signal: AbortSignal): Promise<GitHubResult<NotificationThread[]>> => {
    try {
      return await effects.readThreads(signal);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      return { ok: false, failure: { kind: 'requestFailed', status: null, message } };
    }
  };

  const refresh = () => {
    generation += 1;

    const own = generation;
    const abort = new AbortController();

    controller = abort;
    update(startRefresh(snapshot));

    const complete = (result: GitHubResult<NotificationThread[]>) => {
      if (stopped || own !== generation) {
        return;
      }

      const now = effects.now();

      controller = null;

      update(
        result.ok
          ? applyThreads(snapshot, result.value, now)
          : applyFailure(snapshot, result.failure, now),
      );

      if (followUpPending) {
        followUpPending = false;
        refresh();
      }
    };

    // A listener that throws must not stop the session.
    readThreads(abort.signal)
      .then(complete)
      .catch(() => undefined);
  };

  const requestRefresh = () => {
    if (controller !== null) {
      followUpPending = true;

      return;
    }

    refresh();
  };

  const send = (intent: ApplicationIntent) => {
    if (stopped) {
      return;
    }

    if (intent.kind === 'refresh') {
      requestRefresh();
    } else {
      update(moveSelection(snapshot, intent.kind === 'selectNext' ? 1 : -1));
    }
  };

  const stop = () => {
    stopped = true;
    controller?.abort();
    controller = null;
    listeners.clear();
  };

  return { getSnapshot, subscribe, send, stop };
};
