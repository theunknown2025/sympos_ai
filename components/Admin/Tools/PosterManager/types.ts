export type PosterElementKind = 'shape' | 'image' | 'text' | 'icon' | 'qrcode';

export type PosterLayerRef = {
  kind: PosterElementKind;
  id: string;
};

export type PosterElementBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PosterImageBox = PosterElementBox;

export type PosterImageItem = {
  id: string;
  label: string;
  box: PosterImageBox;
  imageSrc: string | null;
  cropX: number;
  cropY: number;
};

export type PosterShapeKind = 'square' | 'circle' | 'rectangle';

export type PosterShapeItem = {
  id: string;
  label: string;
  kind: PosterShapeKind;
  box: PosterElementBox;
  fillColor: string;
  borderColor: string;
  borderWidthMm: number;
  borderRadiusMm: number;
  opacity: number;
};

export type PosterTextKind = 'line' | 'paragraph';

export type PosterTextItem = {
  id: string;
  label: string;
  kind: PosterTextKind;
  box: PosterElementBox;
  content: string;
  fontFamilyId: string;
  fontSizeMm: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  opacity: number;
};

export type PosterIconItem = {
  id: string;
  label: string;
  box: PosterElementBox;
  iconId: string;
  color: string;
  opacity: number;
};

export type PosterQrItem = {
  id: string;
  label: string;
  box: PosterElementBox;
  url: string;
  foregroundColor: string;
  backgroundColor: string;
};

export type PosterSelectedElement = {
  kind: PosterElementKind;
  id: string;
} | null;
