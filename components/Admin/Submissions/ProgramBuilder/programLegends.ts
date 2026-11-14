import type { ProgramBuilderConfig, ProgramCard } from './ProgramBuilder';

export interface ProgramLegendEntry {
  id: string;
  label: string;
  color: string;
}

export const DEFAULT_PROGRAM_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
] as const;

const DEFAULT_LEGEND_LABELS = [
  'Keynote',
  'Plenary',
  'Oral session',
  'Workshop',
  'Poster block',
  'Panel',
  'Break',
  'Other',
];

export function createDefaultLegends(): ProgramLegendEntry[] {
  return DEFAULT_PROGRAM_COLORS.map((color, index) => ({
    id: `legend-${index + 1}`,
    label: DEFAULT_LEGEND_LABELS[index] ?? `Category ${index + 1}`,
    color,
  }));
}

export function normalizeHexColor(color: string): string {
  const trimmed = color.trim().toLowerCase();
  if (!trimmed) return '#3b82f6';
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const h = trimmed.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export function colorsMatch(a: string, b: string): boolean {
  return normalizeHexColor(a) === normalizeHexColor(b);
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex).replace('#', '');
  if (normalized.length !== 6) return [59, 130, 246];
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Light fill + accent border for session blocks in exports */
export function getSessionBlockStyles(color: string): {
  borderLeftColor: string;
  backgroundColor: string;
  borderColor: string;
} {
  return {
    borderLeftColor: normalizeHexColor(color),
    backgroundColor: hexToRgba(color, 0.12),
    borderColor: hexToRgba(color, 0.35),
  };
}

export function getLegendLabelForColor(
  legends: ProgramLegendEntry[] | undefined,
  color: string
): string | undefined {
  if (!legends?.length) return undefined;
  const match = legends.find((entry) => colorsMatch(entry.color, color));
  return match?.label?.trim() || undefined;
}

/** Legends to show in exports: configured entries used on this day, or derived from card colors */
export function getLegendsForExport(
  config: ProgramBuilderConfig,
  dayCards: ProgramCard[]
): ProgramLegendEntry[] {
  const configured = config.legends ?? [];
  const usedColors = [...new Set(dayCards.map((c) => normalizeHexColor(c.color)))];

  if (configured.length > 0) {
    const used = configured.filter((entry) =>
      usedColors.some((color) => colorsMatch(entry.color, color))
    );
    return used.length > 0 ? used : configured;
  }

  return usedColors.map((color, index) => ({
    id: `derived-${index}`,
    label: `Session ${index + 1}`,
    color,
  }));
}

export function getPrimaryCardColor(config: ProgramBuilderConfig): string {
  return config.legends?.[0]?.color ?? DEFAULT_PROGRAM_COLORS[0];
}

export function newLegendId(): string {
  return `legend-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
