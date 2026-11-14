import React from 'react';
import type { PosterElementBox, PosterImageBox } from './types';
import PosterElementFrame from './PosterElementFrame';

type PosterImageBoxProps = {
  box: PosterImageBox;
  zoom: number;
  zIndex: number;
  pageWidth: number;
  pageHeight: number;
  pageRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  imageSrc: string | null;
  cropX: number;
  cropY: number;
  label: string;
  gridMm: number;
  onSelect: () => void;
  onChange: (box: PosterElementBox) => void;
  onEdit: () => void;
  onDelete: () => void;
};

const PosterImageBoxOverlay: React.FC<PosterImageBoxProps> = ({
  box,
  zoom,
  zIndex,
  pageWidth,
  pageHeight,
  isSelected,
  imageSrc,
  cropX,
  cropY,
  label,
  onSelect,
  onChange,
  onEdit,
  onDelete,
  pageRef,
  gridMm,
}) => (
  <PosterElementFrame
    box={box}
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
    selectedClassName="border-2 border-dashed border-indigo-500 bg-indigo-50/40 cursor-move ring-2 ring-indigo-200/60 overflow-hidden"
    unselectedClassName="border border-slate-300 bg-white shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-100 overflow-hidden"
  >
    {imageSrc ? (
      <div
        className="w-full h-full pointer-events-none"
        style={{
          backgroundImage: `url(${imageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: `${cropX}% ${cropY}%`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-indigo-600/80 pointer-events-none px-1 text-center">
        {label}
      </div>
    )}
  </PosterElementFrame>
);

export default PosterImageBoxOverlay;
