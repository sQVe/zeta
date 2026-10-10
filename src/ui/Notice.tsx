import type { ReactNode } from 'react';

import type { Snapshot } from '../session/session.ts';
import type { Palette } from './palette.ts';

const noticeText = {
  ghMissing: 'Install GitHub CLI from https://cli.github.com, then press r',
  notSignedIn: 'Run gh auth login, then press r',
};

const readMessage = (snapshot: Snapshot): { text: string; dim: boolean } | null => {
  if (snapshot.notice !== null) {
    return { text: noticeText[snapshot.notice], dim: false };
  }

  if (!snapshot.hasLoaded) {
    return { text: 'Loading notifications...', dim: true };
  }

  if (snapshot.threads.length === 0 && snapshot.errorMessage === null) {
    return { text: 'No open notifications', dim: false };
  }

  return null;
};

export const hasNotice = (snapshot: Snapshot): boolean => readMessage(snapshot) !== null;

export const Notice = (props: { snapshot: Snapshot; palette: Palette }): ReactNode => {
  const message = readMessage(props.snapshot);

  if (message === null) {
    return null;
  }

  const color = message.dim ? props.palette.dim : props.palette.text;

  return (
    <box flexGrow={1} alignItems="center" justifyContent="center">
      <text fg={color}>{message.text}</text>
    </box>
  );
};
