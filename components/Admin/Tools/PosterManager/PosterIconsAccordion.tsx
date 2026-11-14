import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { PX_PER_MM } from './posterConstants';
import { POSTER_ICON_OPTIONS } from './posterIconCatalog';
import type { PosterElementBox, PosterIconItem } from './types';

function pxToMm(px: number) {
  return Math.round(px / PX_PER_MM);
}

type PosterIconsAccordionProps = {
  open: boolean;
  onToggle: () => void;
  items: PosterIconItem[];
  selectedId: string | null;
  expandedId: string | null;
  gridMm: number;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onToggleItem: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PosterIconItem>) => void;
  onUpdateBoxField: (id: string, field: keyof PosterElementBox, mmValue: number) => void;
  onDelete: (id: string) => void;
};

const PosterIconsAccordion: React.FC<PosterIconsAccordionProps> = ({
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
      <span className="font-semibold text-sm text-slate-800">Icons</span>
      {open ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
    </button>
    {open && (
      <div className="p-3 bg-white border-t border-slate-100 space-y-3">
        <button type="button" onClick={onAdd} className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50">
          <Plus size={16} /> Add icon
        </button>
        {items.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No icons yet.</p>}
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
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Icon</p>
                    <div className="grid grid-cols-3 gap-2">
                      {POSTER_ICON_OPTIONS.map(({ id, label, Icon }) => (
                        <button key={id} type="button" onClick={() => onUpdate(item.id, { iconId: id })} className={`flex flex-col items-center gap-1 rounded-md border p-2 text-[10px] ${item.iconId === id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                          <Icon size={18} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['x', 'y', 'width', 'height'] as const).map((field) => (
                      <label key={field} className="text-xs text-slate-600 capitalize">
                        {field}
                        <input type="number" min={field === 'x' || field === 'y' ? 0 : 1} value={pxToMm(item.box[field])} onChange={(e) => onUpdateBoxField(item.id, field, Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                      </label>
                    ))}
                  </div>
                  <label className="text-xs text-slate-600">Color<input type="color" value={item.color} onChange={(e) => onUpdate(item.id, { color: e.target.value })} className="mt-1 h-8 w-full rounded-md border border-slate-200" /></label>
                  <label className="block text-xs text-slate-600">Opacity: {item.opacity}%<input type="range" min={10} max={100} value={item.opacity} onChange={(e) => onUpdate(item.id, { opacity: Number(e.target.value) })} className="mt-1 w-full accent-indigo-600" /></label>
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

export default PosterIconsAccordion;
