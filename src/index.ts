import { catalog } from './commands.ts';
import { createGhRunner, readNotificationThreads } from './github/github.ts';
import { createSession } from './session/session.ts';
import { startTerminal } from './terminal.tsx';

const now = () => new Date();
const githubEffects = { runGh: createGhRunner(), now };

await startTerminal({
  session: createSession({
    readThreads: (signal) => readNotificationThreads(githubEffects, signal),
    now,
  }),
  catalog,
});
