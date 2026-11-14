import React from 'react';
import type { PosterElementBox, PosterIconItem } from './types';
import PosterElementFrame from './PosterElementFrame';
import { getPosterIcon } from './posterIconCatalog';

type PosterIconBoxProps = {
  item: PosterIconItem;
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

const PosterIconBox: React.FC<PosterIconBoxProps> = ({
  item,
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
  const { Icon } = getPosterIcon(item.iconId);
  const iconSize = Math.min(item.box.width, item.box.height) * zoom * 0.65;

  return (
    <PosterElementFrame
      box={item.box}
      zoom={zoom}
      zIndex={zIndex}
      pageWidth={pageWidth}
      pageHeight={pageHeight}
      pageRef={pageRef}
      isSelected={isSelected}
      gridMm={gridMm}
      lockSquare
      onSelect={onSelect}
      onChange={onChange}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div
        className="w-full h-full flex items-center justify-center pointer-events-none"
        style={{ opacity: item.opacity / 100 }}
      >
        <Icon size={iconSize} color={item.color} strokeWidth={2} />
      </div>
    </PosterElementFrame>
  );
};

export default PosterIconBox;
