import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { PosterElementBox, PosterQrItem } from './types';
import PosterElementFrame from './PosterElementFrame';

type PosterQrBoxProps = {
  item: PosterQrItem;
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

const PosterQrBox: React.FC<PosterQrBoxProps> = ({
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
  const size = Math.min(item.box.width, item.box.height) * zoom;

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
      selectedClassName="ring-2 ring-indigo-400 ring-offset-1 cursor-move bg-white"
      unselectedClassName="cursor-pointer hover:ring-2 hover:ring-indigo-200 bg-white"
    >
      <div className="w-full h-full flex items-center justify-center pointer-events-none p-1">
        {item.url.trim() ? (
          <QRCodeSVG
            value={item.url}
            size={size - 8}
            bgColor={item.backgroundColor}
            fgColor={item.foregroundColor}
            level="M"
          />
        ) : (
          <span className="text-[10px] text-slate-400 text-center px-1">Enter a link</span>
        )}
      </div>
    </PosterElementFrame>
  );
};

export default PosterQrBox;
