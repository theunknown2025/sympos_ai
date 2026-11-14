import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ProgramBuilderConfig } from './ProgramBuilder';
import {
  createDefaultLegends,
  DEFAULT_PROGRAM_COLORS,
  newLegendId,
  normalizeHexColor,
  type ProgramLegendEntry,
} from './programLegends';

interface ProgramLegendsEditorProps {
  config: ProgramBuilderConfig;
  onChange: (legends: ProgramLegendEntry[]) => void;
}

const ProgramLegendsEditor: React.FC<ProgramLegendsEditorProps> = ({ config, onChange }) => {
  const legends = config.legends ?? [];

  const updateLegends = (next: ProgramLegendEntry[]) => {
    onChange(next);
  };

  const handleLabelChange = (id: string, label: string) => {
    updateLegends(legends.map((entry) => (entry.id === id ? { ...entry, label } : entry)));
  };

  const handleColorChange = (id: string, color: string) => {
    updateLegends(
      legends.map((entry) => (entry.id === id ? { ...entry, color: normalizeHexColor(color) } : entry))
    );
  };

  const handleRemove = (id: string) => {
    updateLegends(legends.filter((entry) => entry.id !== id));
  };

  const handleAdd = () => {
    const usedColors = new Set(legends.map((e) => normalizeHexColor(e.color)));
    const nextColor =
      DEFAULT_PROGRAM_COLORS.find((c) => !usedColors.has(c)) ?? DEFAULT_PROGRAM_COLORS[0];
    updateLegends([
      ...legends,
      {
        id: newLegendId(),
        label: '',
        color: nextColor,
      },
    ]);
  };

  const handleLoadDefaults = () => {
    if (legends.length > 0 && !confirm('Replace current legends with the default palette?')) {
      return;
    }
    updateLegends(createDefaultLegends());
  };

  return (
    <div className="pt-4 border-t border-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Legends</label>
          <p className="text-xs text-slate-500 mt-0.5">
            Name each color used for session types. Shown in preview, PDF, and PNG exports.
          </p>
        </div>
        {legends.length === 0 ? (
          <button
            type="button"
            onClick={handleLoadDefaults}
            className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Load defaults
          </button>
        ) : null}
      </div>

      {legends.length === 0 ? (
        <p className="text-xs text-slate-500 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
          No legends yet. Add entries to label colors, or load the default palette.
        </p>
      ) : (
        <ul className="space-y-2">
          {legends.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2"
            >
              <input
                type="color"
                value={normalizeHexColor(entry.color)}
                onChange={(e) => handleColorChange(entry.id, e.target.value)}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-slate-300 bg-white p-0.5"
                aria-label="Legend color"
              />
              <input
                type="text"
                value={entry.label}
                onChange={(e) => handleLabelChange(entry.id, e.target.value)}
                placeholder="e.g. Keynote"
                className="min-w-0 flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={() => handleRemove(entry.id)}
                className="shrink-0 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                aria-label="Remove legend"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleAdd}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-800"
      >
        <Plus size={16} />
        Add legend
      </button>
    </div>
  );
};

export default ProgramLegendsEditor;
