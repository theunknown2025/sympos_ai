export const PX_PER_MM = 3;

export const POSTER_FORMATS = [
  { id: 'a3', label: 'A3', widthMm: 297, heightMm: 420 },
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'a5', label: 'A5', widthMm: 148, heightMm: 210 },
] as const;

export const GRID_SPACING_OPTIONS = [
  { id: '5', label: '5 mm', mm: 5 },
  { id: '10', label: '10 mm', mm: 10 },
  { id: '15', label: '15 mm', mm: 15 },
  { id: '20', label: '20 mm', mm: 20 },
  { id: '25', label: '25 mm', mm: 25 },
] as const;

export type PosterFormatId = (typeof POSTER_FORMATS)[number]['id'];
export type GridSpacingId = (typeof GRID_SPACING_OPTIONS)[number]['id'];

export function pageSizePx(widthMm: number, heightMm: number) {
  return {
    width: widthMm * PX_PER_MM,
    height: heightMm * PX_PER_MM,
  };
}

export function gridStepPx(gridMm: number) {
  return gridMm * PX_PER_MM;
}

export function snapToGrid(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function clampBox(
  box: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number,
  gridMm: number,
) {
  const minSize = gridStepPx(gridMm);
  const width = Math.max(minSize, Math.min(box.width, pageWidth));
  const height = Math.max(minSize, Math.min(box.height, pageHeight));
  const x = Math.min(Math.max(box.x, 0), pageWidth - width);
  const y = Math.min(Math.max(box.y, 0), pageHeight - height);
  return { x, y, width, height };
}
