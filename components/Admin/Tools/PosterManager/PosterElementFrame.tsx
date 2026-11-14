import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { PosterElementBox } from './types';
import { usePosterBoxInteraction } from './usePosterBoxInteraction';

type PosterElementFrameProps = {
  box: PosterElementBox;
  zoom: number;
  zIndex: number;
  pageWidth: number;
  pageHeight: number;
  pageRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  gridMm: number;
  lockSquare?: boolean;
  onSelect: () => void;
  onChange: (box: PosterElementBox) => void;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
  selectedClassName?: string;
  unselectedClassName?: string;
};

const PosterElementFrame: React.FC<PosterElementFrameProps> = ({
  box,
  zoom,
  zIndex,
  pageWidth,
  pageHeight,
  pageRef,
  isSelected,
  gridMm,
  lockSquare = false,
  onSelect,
  onChange,
  onEdit,
  onDelete,
  children,
  selectedClassName = 'ring-2 ring-indigo-400 ring-offset-1 cursor-move',
  unselectedClassName = 'cursor-pointer hover:ring-2 hover:ring-indigo-200',
}) => {
  const [hovered, setHovered] = useState(false);
  const { startSession } = usePosterBoxInteraction({
    box,
    zoom,
    pageWidth,
    pageHeight,
    pageRef,
    isSelected,
    gridMm,
    lockSquare,
    onChange,
  });

  const handleMouseDown = (event: React.MouseEvent) => {
    onSelect();
    startSession('move', event);
  };

  const showToolbar = hovered || isSelected;

  return (
    <div
      className="absolute"
      style={{
        left: box.x * zoom,
        top: box.y * zoom,
        width: box.width * zoom,
        height: box.height * zoom,
        zIndex,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {showToolbar && (
        <div
          data-poster-export-hide
          className="absolute -top-9 right-0 flex gap-1 z-50 pointer-events-auto"
        >
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-sm"
            aria-label="Edit element"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 shadow-sm"
            aria-label="Delete element"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div
        className={`relative w-full h-full ${isSelected ? selectedClassName : unselectedClassName}`}
        onMouseDown={handleMouseDown}
      >
        {children}

        {isSelected && (
          <div
            data-poster-export-hide
            className="absolute bottom-0 right-0 w-3 h-3 translate-x-1/2 translate-y-1/2 bg-indigo-600 border-2 border-white rounded-sm cursor-se-resize z-10"
            onMouseDown={(event) => startSession('resize', event)}
          />
        )}
      </div>
    </div>
  );
};

export default PosterElementFrame;
