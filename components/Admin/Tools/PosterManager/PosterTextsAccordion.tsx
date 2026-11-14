import React from 'react';
import { AlignLeft, ChevronDown, ChevronUp, Trash2, Type } from 'lucide-react';
import PosterTextEditorToolbar from './PosterTextEditorToolbar';
import { PX_PER_MM } from './posterConstants';
import type { PosterElementBox, PosterTextItem, PosterTextKind } from './types';

function pxToMm(px: number) {
  return Math.round(px / PX_PER_MM);
}

type PosterTextsAccordionProps = {
  open: boolean;
  onToggle: () => void;
  items: PosterTextItem[];
  selectedId: string | null;
  expandedId: string | null;
  gridMm: number;
  onAdd: (kind: PosterTextKind) => void;
  onSelect: (id: string) => void;
  onToggleItem: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PosterTextItem>) => void;
  onUpdateBoxField: (id: string, field: keyof PosterElementBox, mmValue: number) => void;
  onDelete: (id: string) => void;
};

const PosterTextsAccordion: React.FC<PosterTextsAccordionProps> = ({
  open,
  onToggle,
  items,
  selectedId,
  expandedId,
  gridMm,
  onAdd,
  onSelect,
  onToggleItem,
  onUpdate,
  onUpdateBoxField,
  onDelete,
}) => (
  <div className={`border rounded-lg overflow-hidden ${open ? 'border-indigo-200 shadow-sm' : 'border-slate-200'}`}>
    <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-50 text-left">
      <span className="font-semibold text-sm text-slate-800">Text</span>
      {open ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
    </button>
    {open && (
      <div className="p-3 bg-white border-t border-slate-100 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onAdd('line')} className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-2 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50">
            <Type size={14} /> Line
          </button>
          <button type="button" onClick={() => onAdd('paragraph')} className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-2 text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50">
            <AlignLeft size={14} /> Paragraph
          </button>
        </div>
        {items.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No text yet.</p>}
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const isSelected = selectedId === item.id;
          return (
            <div key={item.id} className={`border rounded-lg overflow-hidden ${isSelected ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
              <div className="flex items-center gap-1 p-2 bg-slate-50/60">
                <button type="button" onClick={() => { onSelect(item.id); onToggleItem(item.id); }} className="flex-1 flex items-center justify-between min-w-0 text-left px-1">
                  <span className="text-sm font-medium text-slate-800 truncate">{item.label}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button type="button" onClick={() => onDelete(item.id)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
              </div>
              {isExpanded && (
                <div className="p-3 space-y-3 border-t border-slate-100">
                  <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    {(['line', 'paragraph'] as const).map((kind) => (
                      <button key={kind} type="button" onClick={() => onUpdate(item.id, { kind })} className={`flex-1 px-1 py-1 text-[10px] font-medium rounded-md ${item.kind === kind ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}>
                        {kind === 'line' ? 'Line' : 'Paragraph'}
                      </button>
                    ))}
                  </div>

                  <label className="block text-xs text-slate-600">
                    Content
                    {item.kind === 'paragraph' ? (
                      <textarea
                        value={item.content}
                        onChange={(e) => onUpdate(item.id, { content: e.target.value })}
                        rows={3}
                        className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm resize-y min-h-[4rem]"
                        style={{ fontFamily: 'inherit' }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={item.content}
                        onChange={(e) => onUpdate(item.id, { content: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                      />
                    )}
                  </label>

                  <PosterTextEditorToolbar item={item} onUpdate={(patch) => onUpdate(item.id, patch)} />

                  <details className="group">
                    <summary className="text-[10px] font-medium uppercase tracking-wide text-slate-400 cursor-pointer list-none flex items-center justify-between">
                      Position
                      <ChevronDown size={12} className="group-open:rotate-180 transition-transform text-slate-400" />
                    </summary>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(['x', 'y', 'width', 'height'] as const).map((field) => (
                        <label key={field} className="text-xs text-slate-600 capitalize">
                          {field}
                          <input
                            type="number"
                            min={field === 'x' || field === 'y' ? 0 : 1}
                            value={pxToMm(item.box[field])}
                            onChange={(e) => onUpdateBoxField(item.id, field, Number(e.target.value))}
                            className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                          />
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">Snaps to {gridMm} mm grid.</p>
                  </details>
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default PosterTextsAccordion;
