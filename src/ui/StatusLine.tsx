import type { ReactNode } from 'react';

import type { Snapshot } from '../session/session.ts';
import type { Palette } from './palette.ts';

export const StatusLine = (props: { snapshot: Snapshot; palette: Palette }): ReactNode => {
  const { snapshot, palette } = props;

  return (
    <box height={1} flexShrink={0} flexDirection="row" gap={2}>
      <text fg={palette.dim}>? help</text>
      {snapshot.refreshStatus === 'running' ? <text fg={palette.dim}>refreshing...</text> : null}
      {snapshot.errorMessage === null ? null : (
        <text fg={palette.error}>{snapshot.errorMessage}</text>
      )}
    </box>
  );
};
