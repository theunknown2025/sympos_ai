import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { PX_PER_MM } from './posterConstants';
import type { PosterElementBox, PosterQrItem } from './types';

function pxToMm(px: number) {
  return Math.round(px / PX_PER_MM);
}

type PosterQrAccordionProps = {
  open: boolean;
  onToggle: () => void;
  items: PosterQrItem[];
  selectedId: string | null;
  expandedId: string | null;
  gridMm: number;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onToggleItem: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PosterQrItem>) => void;
  onUpdateBoxField: (id: string, field: keyof PosterElementBox, mmValue: number) => void;
  onDelete: (id: string) => void;
};

const PosterQrAccordion: React.FC<PosterQrAccordionProps> = ({
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
      <span className="font-semibold text-sm text-slate-800">QR code</span>
      {open ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
    </button>
    {open && (
      <div className="p-3 bg-white border-t border-slate-100 space-y-3">
        <button type="button" onClick={onAdd} className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50">
          <Plus size={16} /> Add QR code
        </button>
        {items.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No QR codes yet.</p>}
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
                  <label className="block text-xs text-slate-600">
                    Link URL
                    <input type="url" value={item.url} onChange={(e) => onUpdate(item.id, { url: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['x', 'y', 'width', 'height'] as const).map((field) => (
                      <label key={field} className="text-xs text-slate-600 capitalize">
                        {field}
                        <input type="number" min={field === 'x' || field === 'y' ? 0 : 1} value={pxToMm(item.box[field])} onChange={(e) => onUpdateBoxField(item.id, field, Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-600">Foreground<input type="color" value={item.foregroundColor} onChange={(e) => onUpdate(item.id, { foregroundColor: e.target.value })} className="mt-1 h-8 w-full rounded-md border border-slate-200" /></label>
                    <label className="text-xs text-slate-600">Background<input type="color" value={item.backgroundColor} onChange={(e) => onUpdate(item.id, { backgroundColor: e.target.value })} className="mt-1 h-8 w-full rounded-md border border-slate-200" /></label>
                  </div>
                  <p className="text-[11px] text-slate-400">Snaps to {gridMm} mm grid.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default PosterQrAccordion;
