import React, { useEffect, useMemo, useState } from 'react';
import AiPosterGeneralForm from './AiPosterGeneralForm';
import AiPosterGenerateStep from './AiPosterGenerateStep';
import AiPosterStepIndicator from './AiPosterStepIndicator';
import { generateAiPoster, toImageDataUrl } from './aiPosterService';
import { createDefaultAiPosterInfo } from './defaults';
import {
  downloadAiPosterPdf,
  downloadAiPosterPng,
  saveAiPosterDraft,
} from './exportAiPoster';
import type {
  AiPosterGeneralInfo,
  AiPosterGenerationStatus,
  AiPosterResult,
  AiPosterStep,
} from './types';

type AiPosterPanelProps = {
  info: AiPosterGeneralInfo;
  onInfoChange: (info: AiPosterGeneralInfo) => void;
  result: AiPosterResult | null;
  onResultChange: (result: AiPosterResult | null) => void;
  formatId: string;
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
  exporting: boolean;
  onExportingChange: (value: boolean) => void;
};

const AiPosterPanel: React.FC<AiPosterPanelProps> = ({
  info,
  onInfoChange,
  result,
  onResultChange,
  formatId,
  widthPx,
  heightPx,
  widthMm,
  heightMm,
  exporting,
  onExportingChange,
}) => {
  const [step, setStep] = useState<AiPosterStep>(1);
  const [status, setStatus] = useState<AiPosterGenerationStatus>(result ? 'ready' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!result) {
      setStatus((current) => (current === 'generating' ? current : 'idle'));
    } else {
      setStatus('ready');
    }
  }, [result]);

  const canGoStep2 = useMemo(() => info.title.trim().length > 0, [info.title]);

  const handleGenerate = async () => {
    if (!canGoStep2) return;
    setStatus('generating');
    setError(null);
    onResultChange(null);
    try {
      const response = await generateAiPoster({
        info,
        formatId,
        widthPx,
        heightPx,
      });
      // Final product = OpenAI image only (no local UI overlay)
      const imageDataUrl = toImageDataUrl(response.imageBase64, response.mimeType || 'image/png');

      onResultChange({
        imageDataUrl,
        revisedPrompt: response.revisedPrompt,
        model: response.model,
        createdAt: new Date().toISOString(),
        usedReferences: response.usedReferences,
      });
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Generation failed');
    }
  };

  const handleSave = () => {
    saveAiPosterDraft({
      info,
      result,
      formatId,
      savedAt: new Date().toISOString(),
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const fileBase = (info.title || 'ai-poster').replace(/[^\w\-]+/g, '_').slice(0, 48);

  const handleExportPng = async () => {
    if (!result?.imageDataUrl) return;
    onExportingChange(true);
    try {
      await downloadAiPosterPng(result.imageDataUrl, `${fileBase}.png`);
    } finally {
      onExportingChange(false);
    }
  };

  const handleExportPdf = async () => {
    if (!result?.imageDataUrl) return;
    onExportingChange(true);
    try {
      await downloadAiPosterPdf(result.imageDataUrl, `${fileBase}.pdf`, widthMm, heightMm);
    } finally {
      onExportingChange(false);
    }
  };

  return (
    <div className="space-y-3">
      <AiPosterStepIndicator step={step} onStepChange={setStep} canGoStep2={canGoStep2} />

      {step === 1 ? (
        <>
          <AiPosterGeneralForm info={info} onChange={onInfoChange} />
          <button
            type="button"
            disabled={!canGoStep2}
            onClick={() => setStep(2)}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to AI generation
          </button>
          <button
            type="button"
            onClick={() => onInfoChange(createDefaultAiPosterInfo())}
            className="w-full text-[11px] text-slate-500 hover:text-slate-700"
          >
            Reset to sample content
          </button>
        </>
      ) : (
        <>
          <AiPosterGenerateStep
            status={status}
            error={error}
            result={result}
            canGenerate={canGoStep2}
            onGenerate={handleGenerate}
            onSave={handleSave}
            onExportPng={handleExportPng}
            onExportPdf={handleExportPdf}
            exporting={exporting}
          />
          {savedFlash && (
            <p className="text-center text-[11px] font-medium text-emerald-700">Draft saved locally.</p>
          )}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-[11px] font-medium text-slate-500 hover:text-slate-800"
          >
            ← Back to general information
          </button>
        </>
      )}
    </div>
  );
};

export default AiPosterPanel;
