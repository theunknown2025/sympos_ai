export type PosterFontOption = {
  id: string;
  label: string;
  family: string;
  google?: boolean;
};

export const POSTER_FONTS: PosterFontOption[] = [
  { id: 'inter', label: 'Inter', family: "'Inter', sans-serif" },
  { id: 'roboto', label: 'Roboto', family: "'Roboto', sans-serif", google: true },
  { id: 'open-sans', label: 'Open Sans', family: "'Open Sans', sans-serif", google: true },
  { id: 'montserrat', label: 'Montserrat', family: "'Montserrat', sans-serif", google: true },
  { id: 'lora', label: 'Lora', family: "'Lora', serif", google: true },
  { id: 'playfair', label: 'Playfair', family: "'Playfair Display', serif", google: true },
  { id: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
  { id: 'times', label: 'Times', family: "'Times New Roman', Times, serif" },
  { id: 'arial', label: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { id: 'courier', label: 'Courier', family: "'Courier New', Courier, monospace" },
];

export const POSTER_FONT_SIZES_MM = [4, 5, 6, 8, 10, 12, 14, 16, 18, 20] as const;

export const POSTER_TEXT_COLORS = [
  '#0f172a',
  '#334155',
  '#4f46e5',
  '#2563eb',
  '#0891b2',
  '#059669',
  '#ca8a04',
  '#dc2626',
  '#ffffff',
  '#000000',
] as const;

let fontsInjected = false;

export function ensurePosterFontsLoaded() {
  if (fontsInjected || typeof document === 'undefined') return;
  const href =
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora:wght@400;700&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;600;700&display=swap';
  if (document.querySelector(`link[href="${href}"]`)) {
    fontsInjected = true;
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  fontsInjected = true;
}

export function getPosterFontFamily(fontId: string) {
  return POSTER_FONTS.find((font) => font.id === fontId)?.family ?? POSTER_FONTS[0].family;
}

export function stepFontSizeMm(current: number, direction: 1 | -1) {
  const sizes = POSTER_FONT_SIZES_MM;
  const index = sizes.findIndex((size) => size === current);
  if (index === -1) {
    const next = sizes.find((size) => size > current) ?? sizes[sizes.length - 1];
    return direction === 1 ? next : sizes[Math.max(0, sizes.indexOf(next) - 1)];
  }
  const nextIndex = Math.min(sizes.length - 1, Math.max(0, index + direction));
  return sizes[nextIndex];
}
