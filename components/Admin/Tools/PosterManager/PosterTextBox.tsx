import React from 'react';
import type { PosterElementBox, PosterTextItem } from './types';
import PosterElementFrame from './PosterElementFrame';
import { getPosterFontFamily } from './posterFontCatalog';
import { PX_PER_MM } from './posterConstants';

type PosterTextBoxProps = {
  item: PosterTextItem;
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

const PosterTextBox: React.FC<PosterTextBoxProps> = ({
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
  const fontSizePx = item.fontSizeMm * PX_PER_MM * zoom;

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
      onSelect={onSelect}
      onChange={onChange}
      onEdit={onEdit}
      onDelete={onDelete}
      selectedClassName="ring-2 ring-indigo-400 ring-offset-1 cursor-move bg-white/80"
      unselectedClassName="cursor-pointer hover:ring-2 hover:ring-indigo-200"
    >
      <div
        className="w-full h-full pointer-events-none overflow-hidden p-1"
        style={{
          color: item.color,
          opacity: item.opacity / 100,
          fontSize: `${fontSizePx}px`,
          fontFamily: getPosterFontFamily(item.fontFamilyId),
          fontWeight: item.fontWeight,
          textAlign: item.textAlign,
          lineHeight: item.kind === 'line' ? 1.2 : 1.45,
          whiteSpace: item.kind === 'line' ? 'nowrap' : 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {item.content || (item.kind === 'line' ? 'Line text' : 'Paragraph text')}
      </div>
    </PosterElementFrame>
  );
};

export default PosterTextBox;
