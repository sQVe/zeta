import type { ReactNode } from 'react';

import type { Palette } from './palette.ts';

export const StatusLine = (props: { palette: Palette }): ReactNode => {
  return (
    <box height={1} flexShrink={0}>
      <text fg={props.palette.dim}>? help</text>
    </box>
  );
};
