import { useEffect, useRef } from 'react';
import type { PosterElementBox } from './types';
import { clampBox, gridStepPx, snapToGrid } from './posterConstants';

type DragSession =
  | {
      kind: 'move';
      startClientX: number;
      startClientY: number;
      origin: PosterElementBox;
    }
  | {
      kind: 'resize';
      startClientX: number;
      startClientY: number;
      origin: PosterElementBox;
    };

type UsePosterBoxInteractionOptions = {
  box: PosterElementBox;
  zoom: number;
  pageWidth: number;
  pageHeight: number;
  pageRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  gridMm: number;
  lockSquare: boolean;
  onChange: (box: PosterElementBox) => void;
};

export function usePosterBoxInteraction({
  box,
  zoom,
  pageWidth,
  pageHeight,
  pageRef,
  isSelected,
  gridMm,
  lockSquare,
  onChange,
}: UsePosterBoxInteractionOptions) {
  const sessionRef = useRef<DragSession | null>(null);
  const step = gridStepPx(gridMm);

  const toPageCoords = (clientX: number, clientY: number, pageEl: HTMLElement) => {
    const rect = pageEl.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  };

  useEffect(() => {
    if (!isSelected) return;

    const handleMove = (event: MouseEvent) => {
      const session = sessionRef.current;
      const pageEl = pageRef.current;
      if (!session || !pageEl) return;

      const pointer = toPageCoords(event.clientX, event.clientY, pageEl);
      const start = toPageCoords(session.startClientX, session.startClientY, pageEl);
      const dx = pointer.x - start.x;
      const dy = pointer.y - start.y;

      if (session.kind === 'move') {
        onChange(
          clampBox(
            {
              ...session.origin,
              x: snapToGrid(session.origin.x + dx, step),
              y: snapToGrid(session.origin.y + dy, step),
            },
            pageWidth,
            pageHeight,
            gridMm,
          ),
        );
        return;
      }

      let width = snapToGrid(session.origin.width + dx, step);
      let height = snapToGrid(session.origin.height + dy, step);
      if (lockSquare) {
        const size = snapToGrid(Math.max(session.origin.width + dx, session.origin.height + dy), step);
        width = size;
        height = size;
      }

      onChange(
        clampBox(
          { ...session.origin, width, height },
          pageWidth,
          pageHeight,
          gridMm,
        ),
      );
    };

    const handleUp = () => {
      sessionRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [gridMm, isSelected, lockSquare, onChange, pageHeight, pageRef, pageWidth, step, zoom]);

  const startSession = (kind: DragSession['kind'], event: React.MouseEvent) => {
    if (!isSelected) return;
    event.preventDefault();
    event.stopPropagation();
    sessionRef.current = {
      kind,
      startClientX: event.clientX,
      startClientY: event.clientY,
      origin: box,
    };
  };

  return { startSession };
}
