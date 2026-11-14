import type {
  PosterElementBox,
  PosterIconItem,
  PosterImageItem,
  PosterQrItem,
  PosterShapeItem,
  PosterShapeKind,
  PosterTextItem,
  PosterTextKind,
} from './types';
import { clampBox, gridStepPx, snapToGrid } from './posterConstants';

const SHAPE_LABELS: Record<PosterShapeKind, string> = {
  square: 'Square',
  circle: 'Circle',
  rectangle: 'Rectangle',
};

const TEXT_LABELS: Record<PosterTextKind, string> = {
  line: 'Line',
  paragraph: 'Paragraph',
};

export function defaultElementBox(
  pageWidth: number,
  pageHeight: number,
  gridMm: number,
  options?: { widthSteps?: number; heightSteps?: number },
): PosterElementBox {
  const step = gridStepPx(gridMm);
  const width = step * (options?.widthSteps ?? 6);
  const height = step * (options?.heightSteps ?? 4);
  return clampBox(
    {
      x: snapToGrid((pageWidth - width) / 2, step),
      y: snapToGrid((pageHeight - height) / 2, step),
      width,
      height,
    },
    pageWidth,
    pageHeight,
    gridMm,
  );
}

export function snapElementBox(
  box: PosterElementBox,
  pageWidth: number,
  pageHeight: number,
  gridMm: number,
) {
  const step = gridStepPx(gridMm);
  return clampBox(
    {
      x: snapToGrid(box.x, step),
      y: snapToGrid(box.y, step),
      width: snapToGrid(box.width, step),
      height: snapToGrid(box.height, step),
    },
    pageWidth,
    pageHeight,
    gridMm,
  );
}

export function createImageItem(
  pageWidth: number,
  pageHeight: number,
  gridMm: number,
  index: number,
): PosterImageItem {
  return {
    id: crypto.randomUUID(),
    label: `Image ${index}`,
    box: defaultElementBox(pageWidth, pageHeight, gridMm),
    imageSrc: null,
    cropX: 50,
    cropY: 50,
  };
}

export function createShapeItem(
  pageWidth: number,
  pageHeight: number,
  gridMm: number,
  kind: PosterShapeKind,
  index: number,
): PosterShapeItem {
  return {
    id: crypto.randomUUID(),
    label: `${SHAPE_LABELS[kind]} ${index}`,
    kind,
    box: defaultElementBox(pageWidth, pageHeight, gridMm, {
      widthSteps: kind === 'rectangle' ? 8 : 5,
      heightSteps: kind === 'rectangle' ? 4 : 5,
    }),
    fillColor: '#4f46e5',
    borderColor: '#312e81',
    borderWidthMm: 0,
    borderRadiusMm: kind === 'square' ? 0 : 4,
    opacity: 85,
  };
}

export function createTextItem(
  pageWidth: number,
  pageHeight: number,
  gridMm: number,
  kind: PosterTextKind,
  index: number,
): PosterTextItem {
  return {
    id: crypto.randomUUID(),
    label: `${TEXT_LABELS[kind]} ${index}`,
    kind,
    box: defaultElementBox(pageWidth, pageHeight, gridMm, {
      widthSteps: kind === 'paragraph' ? 10 : 8,
      heightSteps: kind === 'paragraph' ? 5 : 2,
    }),
    content: kind === 'line' ? 'Your title here' : 'Your paragraph text goes here.',
    fontFamilyId: 'inter',
    fontSizeMm: kind === 'line' ? 8 : 5,
    fontWeight: kind === 'line' ? 'bold' : 'normal',
    color: '#0f172a',
    textAlign: 'left',
    opacity: 100,
  };
}

export function createIconItem(
  pageWidth: number,
  pageHeight: number,
  gridMm: number,
  index: number,
): PosterIconItem {
  const step = gridStepPx(gridMm);
  const size = step * 4;
  return {
    id: crypto.randomUUID(),
    label: `Icon ${index}`,
    box: clampBox(
      {
        x: snapToGrid((pageWidth - size) / 2, step),
        y: snapToGrid((pageHeight - size) / 2, step),
        width: size,
        height: size,
      },
      pageWidth,
      pageHeight,
      gridMm,
    ),
    iconId: 'star',
    color: '#4f46e5',
    opacity: 100,
  };
}

export function createQrItem(
  pageWidth: number,
  pageHeight: number,
  gridMm: number,
  index: number,
): PosterQrItem {
  const step = gridStepPx(gridMm);
  const size = step * 6;
  return {
    id: crypto.randomUUID(),
    label: `QR ${index}`,
    box: clampBox(
      {
        x: snapToGrid((pageWidth - size) / 2, step),
        y: snapToGrid((pageHeight - size) / 2, step),
        width: size,
        height: size,
      },
      pageWidth,
      pageHeight,
      gridMm,
    ),
    url: 'https://example.com',
    foregroundColor: '#0f172a',
    backgroundColor: '#ffffff',
  };
}
