import React from 'react';
import {
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  FileImage,
  FileType,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import PosterExpandableActionButton from './PosterExpandableActionButton';

type PosterToolbarProps = {
  zoom: number;
  fitMode: 'horizontal' | 'vertical' | 'manual';
  exporting: boolean;
  onZoomChange: (value: number) => void;
  onNudgeZoom: (delta: number) => void;
  onFitHorizontal: () => void;
  onFitVertical: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
};

const PosterToolbar: React.FC<PosterToolbarProps> = ({
  zoom,
  fitMode,
  exporting,
  onZoomChange,
  onNudgeZoom,
  onFitHorizontal,
  onFitVertical,
  onExportPng,
  onExportPdf,
}) => (
  <div className="shrink-0 bg-white rounded-xl border border-slate-200 px-3 py-2 flex items-center gap-3 w-full min-w-0">
    <div className="flex items-center gap-1.5 min-w-0 flex-1">
      <button
        type="button"
        onClick={() => onNudgeZoom(-0.1)}
        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0"
        aria-label="Zoom out"
      >
        <ZoomOut size={14} />
      </button>
      <input
        type="range"
        min={0.1}
        max={3}
        step={0.05}
        value={zoom}
        onChange={(e) => onZoomChange(parseFloat(e.target.value))}
        className="flex-1 min-w-0 w-full accent-indigo-600 h-1"
        aria-label="Zoom"
      />
      <button
        type="button"
        onClick={() => onNudgeZoom(0.1)}
        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 shrink-0"
        aria-label="Zoom in"
      >
        <ZoomIn size={14} />
      </button>
      <span className="text-[11px] font-medium text-slate-500 w-9 text-right tabular-nums shrink-0">
        {Math.round(zoom * 100)}%
      </span>
    </div>

    <div className="flex items-center gap-1.5 shrink-0">
      <PosterExpandableActionButton
        icon={<AlignHorizontalSpaceAround size={15} />}
        label="Fit horizontally"
        title="Fit horizontally"
        active={fitMode === 'horizontal'}
        onClick={onFitHorizontal}
      />
      <PosterExpandableActionButton
        icon={<AlignVerticalSpaceAround size={15} />}
        label="Fit vertically"
        title="Fit vertically"
        active={fitMode === 'vertical'}
        onClick={onFitVertical}
      />
      <PosterExpandableActionButton
        icon={<FileImage size={15} />}
        label="Generate PNG"
        title="Generate PNG"
        disabled={exporting}
        onClick={onExportPng}
      />
      <PosterExpandableActionButton
        icon={<FileType size={15} />}
        label="Generate PDF"
        title="Generate PDF"
        disabled={exporting}
        onClick={onExportPdf}
      />
    </div>
  </div>
);

export default PosterToolbar;
