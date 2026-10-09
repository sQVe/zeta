import { afterEach, expect, test } from 'bun:test';

interface Child {
  processHandle: Bun.Subprocess;
  getOutput: () => string;
}

const enterAlternateScreen = '\u001B[?1049h';
const leaveAlternateScreen = '\u001B[?1049l';
const showCursor = '\u001B[?25h';
const waitMilliseconds = 10_000;

const children: Child[] = [];

const startZeta = (): Child => {
  let output = '';
  const decoder = new TextDecoder();

  const processHandle = Bun.spawn(['bun', 'run', 'start'], {
    cwd: new URL('../', import.meta.url).pathname,
    env: { ...process.env, TERM: 'xterm-256color' },
    terminal: {
      cols: 80,
      rows: 24,
      data: (_terminal, data) => {
        output += decoder.decode(data, { stream: true });
      },
    },
  });

  const child: Child = { processHandle, getOutput: () => output };

  children.push(child);

  return child;
};

afterEach(() => {
  for (const child of children.splice(0)) {
    child.processHandle.kill('SIGKILL');
  }
});

const waitForOutput = async (child: Child, text: string): Promise<void> => {
  const deadline = Date.now() + waitMilliseconds;

  while (!child.getOutput().includes(text)) {
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${JSON.stringify(text)}.`);
    }

    await Bun.sleep(25);
  }
};

const waitForExit = async (child: Child): Promise<number> => {
  const timeout = Bun.sleep(waitMilliseconds).then(() => 'timeout' as const);
  const result = await Promise.race([child.processHandle.exited, timeout]);

  if (result === 'timeout') {
    throw new Error('Timed out waiting for Zeta to exit.');
  }

  return result;
};

const expectRestored = (output: string): void => {
  const enter = output.lastIndexOf(enterAlternateScreen);
  const leave = output.lastIndexOf(leaveAlternateScreen);

  expect(enter).toBeGreaterThan(-1);
  expect(leave).toBeGreaterThan(enter);
  expect(output.endsWith(showCursor)).toBe(true);
};

test('q quits and restores the terminal', async () => {
  const child = startZeta();

  await waitForOutput(child, '? help');
  child.processHandle.terminal?.write('q');

  expect(await waitForExit(child)).toBe(0);
  expectRestored(child.getOutput());
}, 30_000);

test('SIGINT quits and restores the terminal', async () => {
  const child = startZeta();

  await waitForOutput(child, '? help');
  child.processHandle.kill('SIGINT');

  expect(await waitForExit(child)).toBe(0);
  expectRestored(child.getOutput());
}, 30_000);

test('Ctrl+C quits and restores the terminal', async () => {
  const child = startZeta();

  await waitForOutput(child, '? help');
  child.processHandle.terminal?.write('\u0003');

  expect(await waitForExit(child)).toBe(0);
  expectRestored(child.getOutput());
}, 30_000);
