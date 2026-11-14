import React from 'react';
import {
  DEFAULT_PROGRAM_COLORS,
  normalizeHexColor,
  type ProgramLegendEntry,
} from './programLegends';

interface ProgramLegendColorPickerProps {
  legends: ProgramLegendEntry[] | undefined;
  value: string;
  onChange: (color: string) => void;
}

const ProgramLegendColorPicker: React.FC<ProgramLegendColorPickerProps> = ({
  legends,
  value,
  onChange,
}) => {
  const normalizedValue = normalizeHexColor(value);
  const legendSwatches = legends?.filter((e) => e.label.trim() || e.color) ?? [];
  const fallbackSwatches = DEFAULT_PROGRAM_COLORS.filter(
    (c) => !legendSwatches.some((e) => normalizeHexColor(e.color) === c)
  );

  const renderSwatch = (color: string, title?: string) => (
    <button
      key={`${color}-${title ?? ''}`}
      type="button"
      title={title}
      onClick={() => onChange(color)}
      className={`h-10 min-w-[2.5rem] rounded-lg border-2 px-2 transition-all ${
        normalizedValue === normalizeHexColor(color)
          ? 'border-slate-900 scale-105'
          : 'border-slate-300 hover:border-slate-500'
      }`}
      style={{ backgroundColor: color }}
    >
      {title ? (
        <span className="sr-only">{title}</span>
      ) : null}
    </button>
  );

  return (
    <div className="space-y-3">
      {legendSwatches.length > 0 ? (
        <div>
          <p className="text-xs text-slate-500 mb-2">From your legend</p>
          <div className="flex flex-wrap gap-2">
            {legendSwatches.map((entry) =>
              renderSwatch(entry.color, entry.label.trim() || 'Legend color')
            )}
          </div>
        </div>
      ) : null}
      <div>
        {legendSwatches.length > 0 ? (
          <p className="text-xs text-slate-500 mb-2">More colors</p>
        ) : null}
        <div className="flex flex-wrap gap-2 items-center">
          {fallbackSwatches.map((c) => renderSwatch(c))}
          <input
            type="color"
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-10 rounded-lg border-2 border-slate-300 cursor-pointer"
            aria-label="Custom color"
          />
        </div>
      </div>
    </div>
  );
};

export default ProgramLegendColorPicker;
