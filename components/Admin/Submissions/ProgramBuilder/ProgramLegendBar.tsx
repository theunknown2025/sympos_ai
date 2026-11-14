import React from 'react';
import { normalizeHexColor, type ProgramLegendEntry } from './programLegends';

interface ProgramLegendBarProps {
  legends: ProgramLegendEntry[];
  className?: string;
}

/**
 * Horizontal color legend for program preview and image exports.
 */
const ProgramLegendBar: React.FC<ProgramLegendBarProps> = ({ legends, className = '' }) => {
  if (!legends.length) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-8 py-3 ${className}`}
      role="list"
      aria-label="Program color legend"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Legend</span>
      {legends.map((entry) => {
        const color = normalizeHexColor(entry.color);
        const label = entry.label.trim() || 'Unnamed';
        return (
          <span key={entry.id} className="inline-flex items-center gap-2 text-sm text-slate-700" role="listitem">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-sm border border-slate-300/80 shadow-sm"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <span className="font-medium">{label}</span>
          </span>
        );
      })}
    </div>
  );
};

export default ProgramLegendBar;
