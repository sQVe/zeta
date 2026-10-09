export interface Palette {
  text: string;
  dim: string;
  key: string;
  overlayBackground: string;
}

const darkPalette: Palette = {
  text: '#d7dae0',
  dim: '#4f5866',
  key: '#e5c07b',
  overlayBackground: '#1c2029',
};

const lightPalette: Palette = {
  text: '#383a42',
  dim: '#a0a1a7',
  key: '#946200',
  overlayBackground: '#f3f4f6',
};

export const pickPalette = (mode: 'light' | 'dark' | null): Palette => {
  return mode === 'light' ? lightPalette : darkPalette;
};
