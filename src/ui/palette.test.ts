import { expect, test } from 'bun:test';

import { pickPalette } from './palette.ts';

test('the light palette differs from the dark palette', () => {
  expect(pickPalette('light')).not.toEqual(pickPalette('dark'));
});

test('an unknown theme mode picks the dark palette', () => {
  expect(pickPalette(null)).toEqual(pickPalette('dark'));
});
