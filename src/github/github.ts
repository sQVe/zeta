import { z } from 'zod';

import type { NotificationThread, ViewerLogin } from '../work/work.ts';
import { toViewerLogin } from '../work/work.ts';
import type { GitHubEffects, GitHubResult } from './ghApi.ts';
import { requestGh } from './ghApi.ts';
import { findNextPage, notificationThreadSchema } from './notifications.ts';

export { createGhRunner } from './ghApi.ts';
export type { GitHubEffects, GitHubFailure, GitHubResult } from './ghApi.ts';

const viewerSchema = z.object({ login: z.string().min(1) });

const notificationPageSchema = z.array(notificationThreadSchema);

const firstNotificationsEndpoint = '/notifications?all=true&per_page=50';

export const readViewer = async (
  effects: GitHubEffects,
  signal: AbortSignal,
): Promise<GitHubResult<ViewerLogin>> => {
  const response = await requestGh(effects, '/user', signal);

  if (!response.ok) {
    return response;
  }

  const parsed = viewerSchema.safeParse(response.value.body);

  if (!parsed.success) {
    return { ok: false, failure: { kind: 'invalidResponse', message: parsed.error.message } };
  }

  return { ok: true, value: toViewerLogin(parsed.data.login) };
};

export const readNotificationThreads = async (
  effects: GitHubEffects,
  signal: AbortSignal,
): Promise<GitHubResult<NotificationThread[]>> => {
  const threads: NotificationThread[] = [];
  let endpoint: string | null = firstNotificationsEndpoint;

  while (endpoint !== null) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- each page URL comes from the previous page
    const response = await requestGh(effects, endpoint, signal);

    if (!response.ok) {
      return response;
    }

    const parsed = notificationPageSchema.safeParse(response.value.body);

    if (!parsed.success) {
      return { ok: false, failure: { kind: 'invalidResponse', message: parsed.error.message } };
    }

    threads.push(...parsed.data);
    endpoint = findNextPage(response.value.headers.get('link'));
  }

  return { ok: true, value: threads };
};
