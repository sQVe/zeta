import { invariant } from '../invariant.ts';

export type ThreadId = string & { readonly brand: 'ThreadId' };

export type ViewerLogin = string & { readonly brand: 'ViewerLogin' };

export interface NotificationThread {
  id: ThreadId;
  reason: string;
  unread: boolean;
  updatedAt: string;
  lastReadAt: string | null;
  title: string;
  subjectType: string;
  subjectUrl: string | null;
  repository: string;
}

export const toThreadId = (value: string): ThreadId => {
  invariant(value !== '', 'A thread ID must not be empty.');

  // SAFETY: the invariant above rejects the only invalid value, an empty string.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- brand constructor
  return value as ThreadId;
};

export const toViewerLogin = (value: string): ViewerLogin => {
  invariant(value !== '', 'A viewer login must not be empty.');

  // SAFETY: the invariant above rejects the only invalid value, an empty string.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- brand constructor
  return value as ViewerLogin;
};

export const isDoneOnGitHub = (thread: NotificationThread): boolean =>
  !thread.unread && thread.lastReadAt === null;

export const selectOpenThreads = (threads: NotificationThread[]): NotificationThread[] =>
  threads.filter((thread) => !isDoneOnGitHub(thread));
