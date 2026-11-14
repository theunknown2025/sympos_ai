import React from 'react';
import type { PosterElementBox, PosterShapeItem } from './types';
import PosterElementFrame from './PosterElementFrame';
import { PX_PER_MM } from './posterConstants';

type PosterShapeBoxProps = {
  shape: PosterShapeItem;
  zoom: number;
  zIndex: number;
  pageWidth: number;
  pageHeight: number;
  pageRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  gridMm: number;
  onSelect: () => void;
  onChange: (box: PosterElementBox) => void;
  onEdit: () => void;
  onDelete: () => void;
};

function shapeBorderRadius(shape: PosterShapeItem, zoom: number) {
  if (shape.kind === 'circle') return '50%';
  const radiusPx = shape.borderRadiusMm * PX_PER_MM * zoom;
  return `${radiusPx}px`;
}

const PosterShapeBox: React.FC<PosterShapeBoxProps> = ({
  shape,
  zoom,
  zIndex,
  pageWidth,
  pageHeight,
  pageRef,
  isSelected,
  gridMm,
  onSelect,
  onChange,
  onEdit,
  onDelete,
}) => {
  const lockSquare = shape.kind === 'square' || shape.kind === 'circle';
  const borderWidthPx = shape.borderWidthMm * PX_PER_MM * zoom;
  const fillOpacity = shape.opacity / 100;

  return (
    <PosterElementFrame
      box={shape.box}
      zoom={zoom}
      zIndex={zIndex}
      pageWidth={pageWidth}
      pageHeight={pageHeight}
      pageRef={pageRef}
      isSelected={isSelected}
      gridMm={gridMm}
      lockSquare={lockSquare}
      onSelect={onSelect}
      onChange={onChange}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div
        className="w-full h-full pointer-events-none"
        style={{
          backgroundColor: shape.fillColor,
          opacity: fillOpacity,
          border:
            borderWidthPx > 0
              ? `${borderWidthPx}px solid ${shape.borderColor}`
              : isSelected
                ? '1px dashed rgba(79, 70, 229, 0.5)'
                : 'none',
          borderRadius: shapeBorderRadius(shape, zoom),
          boxSizing: 'border-box',
        }}
      />
    </PosterElementFrame>
  );
};

export default PosterShapeBox;
