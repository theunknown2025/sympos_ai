import React from 'react';
import { Loader2, Sparkles, Save, ImageDown, FileDown, AlertCircle } from 'lucide-react';
import type { AiPosterGenerationStatus, AiPosterResult } from './types';

type AiPosterGenerateStepProps = {
  status: AiPosterGenerationStatus;
  error: string | null;
  result: AiPosterResult | null;
  canGenerate: boolean;
  onGenerate: () => void;
  onSave: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  exporting: boolean;
};

const AiPosterGenerateStep: React.FC<AiPosterGenerateStepProps> = ({
  status,
  error,
  result,
  canGenerate,
  onGenerate,
  onSave,
  onExportPng,
  onExportPdf,
  exporting,
}) => {
  const generating = status === 'generating';
  const ready = status === 'ready' && Boolean(result?.imageDataUrl);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3">
        <p className="text-xs font-semibold text-indigo-900">Step 2 — OpenAI generation</p>
        <p className="mt-1 text-[11px] leading-relaxed text-indigo-800/80">
          OpenAI will generate a premium A4 conference poster from your content — Moroccan-inspired
          palette, hero illustration, themes, speakers, CTA, QR, and logos — matching the editorial
          layout brief.
        </p>
      </div>

      <button
        type="button"
        disabled={!canGenerate || generating}
        onClick={onGenerate}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {generating ? 'Generating poster…' : ready ? 'Regenerate with OpenAI' : 'Generate poster with OpenAI'}
      </button>

      {!canGenerate && (
        <p className="text-[11px] text-amber-700">Add at least a title before generating.</p>
      )}

      {error && (
        <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

          {ready && (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
          <p className="text-xs font-semibold text-emerald-800">Poster ready</p>
          {result?.model && (
            <p className="text-[10px] text-emerald-700/80">Model: {result.model}</p>
          )}
          {typeof result?.usedReferences === 'number' && result.usedReferences > 0 && (
            <p className="text-[10px] text-emerald-700/80">
              Included {result.usedReferences} uploaded asset{result.usedReferences === 1 ? '' : 's'} (banner / photos / logos)
            </p>
          )}
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Save size={14} /> Save draft
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={onExportPng}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <ImageDown size={14} /> Download PNG
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={onExportPdf}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <FileDown size={14} /> Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPosterGenerateStep;
