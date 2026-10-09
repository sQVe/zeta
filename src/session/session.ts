export type Snapshot = Record<string, never>;

export interface ApplicationIntent {
  kind: 'noop';
}

export interface Session {
  getSnapshot: () => Snapshot;
  subscribe: (listener: () => void) => () => void;
  send: (intent: ApplicationIntent) => void;
  stop: () => void;
}

export const createSession = (): Session => {
  const listeners = new Set<() => void>();
  let snapshot: Snapshot = {};
  let stopped = false;

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

  const send = (_intent: ApplicationIntent) => {
    if (stopped) {
      return;
    }

    snapshot = { ...snapshot };

    for (const listener of listeners) {
      listener();
    }
  };

  const stop = () => {
    stopped = true;
    listeners.clear();
  };

  return { getSnapshot, subscribe, send, stop };
};
