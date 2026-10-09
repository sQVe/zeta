import { catalog } from './commands.ts';
import { createSession } from './session/session.ts';
import { startTerminal } from './terminal.tsx';

await startTerminal({ session: createSession(), catalog });
