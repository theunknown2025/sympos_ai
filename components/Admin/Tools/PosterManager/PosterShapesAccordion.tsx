import React from 'react';
import { ChevronDown, ChevronUp, Circle, Square, Trash2, RectangleHorizontal } from 'lucide-react';
import { PX_PER_MM } from './posterConstants';
import type { PosterElementBox, PosterShapeItem, PosterShapeKind } from './types';

function pxToMm(px: number) {
  return Math.round(px / PX_PER_MM);
}

const SHAPE_KINDS: { kind: PosterShapeKind; label: string; icon: React.ReactNode }[] = [
  { kind: 'square', label: 'Square', icon: <Square size={14} /> },
  { kind: 'circle', label: 'Circle', icon: <Circle size={14} /> },
  { kind: 'rectangle', label: 'Rectangle', icon: <RectangleHorizontal size={14} /> },
];

type PosterShapesAccordionProps = {
  open: boolean;
  onToggle: () => void;
  shapes: PosterShapeItem[];
  selectedShapeId: string | null;
  expandedShapeId: string | null;
  gridMm: number;
  onAddShape: (kind: PosterShapeKind) => void;
  onSelectShape: (id: string) => void;
  onToggleShape: (id: string) => void;
  onUpdateShape: (id: string, patch: Partial<PosterShapeItem>) => void;
  onUpdateBoxField: (id: string, field: keyof PosterElementBox, mmValue: number) => void;
  onDeleteShape: (id: string) => void;
};

const PosterShapesAccordion: React.FC<PosterShapesAccordionProps> = ({
  open,
  onToggle,
  shapes,
  selectedShapeId,
  expandedShapeId,
  gridMm,
  onAddShape,
  onSelectShape,
  onToggleShape,
  onUpdateShape,
  onUpdateBoxField,
  onDeleteShape,
}) => (
  <div
    className={`border rounded-lg overflow-hidden transition-all ${
      open ? 'border-indigo-200 shadow-sm' : 'border-slate-200'
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-50 text-left"
    >
      <span className="font-semibold text-sm text-slate-800">Shapes</span>
      {open ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
    </button>

    {open && (
      <div className="p-3 bg-white border-t border-slate-100 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {SHAPE_KINDS.map(({ kind, label, icon }) => (
            <button
              key={kind}
              type="button"
              onClick={() => onAddShape(kind)}
              className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-2 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-700"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {shapes.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">No shapes yet.</p>
        )}

        {shapes.map((shape) => {
          const isExpanded = expandedShapeId === shape.id;
          const isSelected = selectedShapeId === shape.id;

          return (
            <div
              key={shape.id}
              className={`border rounded-lg overflow-hidden ${
                isSelected ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1 p-2 bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => {
                    onSelectShape(shape.id);
                    onToggleShape(shape.id);
                  }}
                  className="flex-1 flex items-center justify-between min-w-0 text-left px-1"
                >
                  <span className="text-sm font-medium text-slate-800 truncate">{shape.label}</span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-500 shrink-0" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteShape(shape.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                  aria-label={`Delete ${shape.label}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {isExpanded && (
                <div className="p-3 space-y-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Type</p>
                    <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                      {SHAPE_KINDS.map(({ kind, label }) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => onUpdateShape(shape.id, { kind })}
                          className={`flex-1 px-1 py-1 text-[10px] font-medium rounded-md transition-colors ${
                            shape.kind === kind
                              ? 'bg-white text-indigo-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Position</p>
                    <p className="text-[11px] text-slate-500 mb-2">Snaps to {gridMm} mm grid.</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['x', 'y', 'width', 'height'] as const).map((field) => (
                        <label key={field} className="text-xs text-slate-600 capitalize">
                          {field}
                          <input
                            type="number"
                            min={field === 'x' || field === 'y' ? 0 : 1}
                            value={pxToMm(shape.box[field])}
                            onChange={(e) => onUpdateBoxField(shape.id, field, Number(e.target.value))}
                            className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                          />
                          <span className="text-[10px] text-slate-400">mm</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-600">
                      Fill color
                      <input
                        type="color"
                        value={shape.fillColor}
                        onChange={(e) => onUpdateShape(shape.id, { fillColor: e.target.value })}
                        className="mt-1 h-8 w-full rounded-md border border-slate-200 cursor-pointer"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      Border color
                      <input
                        type="color"
                        value={shape.borderColor}
                        onChange={(e) => onUpdateShape(shape.id, { borderColor: e.target.value })}
                        className="mt-1 h-8 w-full rounded-md border border-slate-200 cursor-pointer"
                      />
                    </label>
                  </div>

                  <label className="block text-xs text-slate-600">
                    Border width: {shape.borderWidthMm} mm
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={shape.borderWidthMm}
                      onChange={(e) =>
                        onUpdateShape(shape.id, { borderWidthMm: Number(e.target.value) })
                      }
                      className="mt-1 w-full accent-indigo-600"
                    />
                  </label>

                  {shape.kind !== 'circle' && (
                    <label className="block text-xs text-slate-600">
                      Corner radius: {shape.borderRadiusMm} mm
                      <input
                        type="range"
                        min={0}
                        max={30}
                        step={1}
                        value={shape.borderRadiusMm}
                        onChange={(e) =>
                          onUpdateShape(shape.id, { borderRadiusMm: Number(e.target.value) })
                        }
                        className="mt-1 w-full accent-indigo-600"
                      />
                    </label>
                  )}

                  <label className="block text-xs text-slate-600">
                    Opacity: {shape.opacity}%
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={1}
                      value={shape.opacity}
                      onChange={(e) => onUpdateShape(shape.id, { opacity: Number(e.target.value) })}
                      className="mt-1 w-full accent-indigo-600"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default PosterShapesAccordion;
