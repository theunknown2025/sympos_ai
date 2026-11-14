import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  GRID_SPACING_OPTIONS,
  POSTER_FORMATS,
  type GridSpacingId,
  type PosterFormatId,
} from './posterConstants';
import { POSTER_TEMPLATES } from './posterTemplateRegistry';
import type { PosterEditorMode, PosterTemplateId } from './posterTemplateTypes';

type PosterConfigurationSectionProps = {
  open: boolean;
  onToggle: () => void;
  editorMode: PosterEditorMode;
  onEditorModeChange: (mode: PosterEditorMode) => void;
  templateId: PosterTemplateId;
  onTemplateIdChange: (id: PosterTemplateId) => void;
  selectedFormatId: PosterFormatId;
  onFormatChange: (id: PosterFormatId) => void;
  gridSpacingId: GridSpacingId;
  onGridSpacingChange: (id: GridSpacingId) => void;
};

const PosterConfigurationSection: React.FC<PosterConfigurationSectionProps> = ({
  open,
  onToggle,
  editorMode,
  onEditorModeChange,
  templateId,
  onTemplateIdChange,
  selectedFormatId,
  onFormatChange,
  gridSpacingId,
  onGridSpacingChange,
}) => {
  const selectedFormat = POSTER_FORMATS.find((format) => format.id === selectedFormatId);
  const activeTemplate = POSTER_TEMPLATES.find((template) => template.id === templateId);
  const gridIndex = Math.max(
    0,
    GRID_SPACING_OPTIONS.findIndex((option) => option.id === gridSpacingId),
  );
  const selectedGrid = GRID_SPACING_OPTIONS[gridIndex] ?? GRID_SPACING_OPTIONS[1];

  const summary =
    editorMode === 'blank'
      ? `Blank · ${selectedFormat?.label ?? 'A4'} · ${selectedGrid.label} grid`
      : editorMode === 'ai'
        ? `AI · ${selectedFormat?.label ?? 'A4'}`
        : `${activeTemplate?.name ?? 'Template'} · ${selectedFormat?.label ?? 'A4'}`;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        open ? 'border-indigo-200 shadow-sm' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 p-3 bg-slate-50/80 hover:bg-slate-50 text-left"
      >
        <div className="min-w-0">
          <span className="font-semibold text-sm text-slate-800">Configuration</span>
          {!open && <p className="text-[11px] text-slate-500 truncate mt-0.5">{summary}</p>}
        </div>
        {open ? <ChevronUp size={18} className="text-slate-500 shrink-0" /> : <ChevronDown size={18} className="text-slate-500 shrink-0" />}
      </button>

      {open && (
        <div className="p-3 bg-white border-t border-slate-100 space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Start from</p>
        <div className="grid grid-cols-3 gap-0.5 rounded-lg border border-slate-200 p-0.5 bg-slate-50">
          <button
            type="button"
            onClick={() => onEditorModeChange('blank')}
            className={`px-1.5 py-2 text-[11px] font-semibold rounded-md transition-colors ${
              editorMode === 'blank'
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Use Blank
          </button>
          <button
            type="button"
            onClick={() => onEditorModeChange('template')}
            className={`px-1.5 py-2 text-[11px] font-semibold rounded-md transition-colors ${
              editorMode === 'template'
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Use Template
          </button>
          <button
            type="button"
            onClick={() => onEditorModeChange('ai')}
            className={`px-1.5 py-2 text-[11px] font-semibold rounded-md transition-colors ${
              editorMode === 'ai'
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Use AI
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          {editorMode === 'blank'
            ? 'Free-form canvas with shapes, images, text, icons, and QR codes.'
            : editorMode === 'ai'
              ? 'Collect event details, then generate a poster with OpenAI.'
              : 'Predefined layout with structured content sections.'}
        </p>
      </div>

      {editorMode === 'template' && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Template</p>
          <div className="grid grid-cols-1 gap-2">
            {POSTER_TEMPLATES.map((template) => {
              const isActive = templateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onTemplateIdChange(template.id)}
                  className={`flex items-start gap-3 rounded-lg border p-2.5 text-left transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-14 rounded-md shrink-0 border border-slate-200 ${template.previewClassName}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                    <p className="text-[11px] text-slate-500 leading-snug">{template.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Page size</p>
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
          {POSTER_FORMATS.map((format) => {
            const isActive = selectedFormatId === format.id;
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => onFormatChange(format.id)}
                className={`flex-1 px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {format.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          {selectedFormat?.widthMm} × {selectedFormat?.heightMm} mm
        </p>
      </div>

      {editorMode === 'blank' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Grid distance</p>
            <span className="text-xs font-semibold text-indigo-700 tabular-nums">{selectedGrid.label}</span>
          </div>
          <input
            type="range"
            min={0}
            max={GRID_SPACING_OPTIONS.length - 1}
            step={1}
            value={gridIndex}
            onChange={(e) => {
              const option = GRID_SPACING_OPTIONS[Number(e.target.value)];
              if (option) onGridSpacingChange(option.id);
            }}
            className="w-full accent-indigo-600"
            aria-label="Grid distance"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400">{GRID_SPACING_OPTIONS[0].label}</span>
            <span className="text-[10px] text-slate-400">
              {GRID_SPACING_OPTIONS[GRID_SPACING_OPTIONS.length - 1].label}
            </span>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};

export default PosterConfigurationSection;
