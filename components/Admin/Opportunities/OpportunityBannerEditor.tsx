import React, { useRef, useState } from 'react';
import { Image, Layers, Loader2, Palette, Trash2 } from 'lucide-react';
import { uploadImageToStorage } from '../../../services/storageService';
import type {
  OpportunityBanner,
  OpportunityBannerImageOverlay,
  OpportunityKind,
} from '../../../types';
import {
  getDefaultOpportunityBanner,
  resolveOpportunityBanner,
} from '../../../utils/opportunityBanner';
import OpportunityBannerDisplay from './OpportunityBannerDisplay';

interface OpportunityBannerEditorProps {
  userId: string;
  kind: OpportunityKind;
  title: string;
  banner?: OpportunityBanner;
  onChange: (banner: OpportunityBanner) => void;
  disabled?: boolean;
}

const OpportunityBannerEditor: React.FC<OpportunityBannerEditorProps> = ({
  userId,
  kind,
  title,
  banner,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const resolved = resolveOpportunityBanner(kind, banner);

  const patch = (partial: Partial<OpportunityBanner>) => {
    onChange({ ...resolved, ...partial });
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadImageToStorage(userId, file, 'opportunity-banners');
      patch({
        type: 'image',
        imageUrl: url,
        imageOverlay: resolved.imageOverlay ?? 'gradient',
      });
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const overlayOptions: { value: OpportunityBannerImageOverlay; label: string }[] = [
    { value: 'none', label: 'No overlay' },
    { value: 'dark', label: 'Dark overlay' },
    { value: 'gradient', label: 'Gradient overlay' },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">Banner</label>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { type: 'image' as const, label: 'Image', icon: Image },
            { type: 'color' as const, label: 'Color', icon: Palette },
            { type: 'gradient' as const, label: 'Gradient', icon: Layers },
          ] as const
        ).map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (type === 'gradient') {
                patch({
                  type: 'gradient',
                  gradientColors:
                    resolved.gradientColors ?? getDefaultOpportunityBanner(kind).gradientColors,
                });
              } else if (type === 'color') {
                patch({
                  type: 'color',
                  color: resolved.color ?? getDefaultOpportunityBanner(kind).gradientColors?.from,
                });
              } else {
                patch({ type: 'image', imageOverlay: resolved.imageOverlay ?? 'gradient' });
              }
            }}
            className={`flex-1 min-w-[5.5rem] px-3 py-2 text-sm border rounded-lg transition-colors inline-flex items-center justify-center gap-1 ${
              resolved.type === type
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {resolved.type === 'image' && (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled || uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await handleUpload(file);
              e.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Uploading…
                </span>
              ) : (
                'Upload image'
              )}
            </button>
            {resolved.imageUrl ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => patch({ imageUrl: undefined })}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 inline-flex items-center gap-1"
              >
                <Trash2 size={14} /> Remove
              </button>
            ) : null}
          </div>
          {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
          <div>
            <span className="block text-xs font-medium text-slate-600 mb-1.5">Image overlay</span>
            <div className="flex flex-wrap gap-2">
              {overlayOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled || !resolved.imageUrl}
                  onClick={() => patch({ imageOverlay: opt.value })}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border ${
                    (resolved.imageOverlay ?? 'gradient') === opt.value
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {resolved.type === 'color' && (
        <div className="flex items-center gap-3">
          <input
            type="color"
            disabled={disabled}
            value={resolved.color || '#4338ca'}
            onChange={(e) => patch({ type: 'color', color: e.target.value })}
            className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
          />
          <input
            type="text"
            disabled={disabled}
            value={resolved.color || '#4338ca'}
            onChange={(e) => patch({ type: 'color', color: e.target.value })}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
      )}

      {resolved.type === 'gradient' && resolved.gradientColors && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-600">From</label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                disabled={disabled}
                value={resolved.gradientColors.from}
                onChange={(e) =>
                  patch({
                    gradientColors: { ...resolved.gradientColors!, from: e.target.value },
                  })
                }
                className="w-10 h-9 rounded border border-slate-300"
              />
              <input
                type="text"
                disabled={disabled}
                value={resolved.gradientColors.from}
                onChange={(e) =>
                  patch({
                    gradientColors: { ...resolved.gradientColors!, from: e.target.value },
                  })
                }
                className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-600">To</label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                disabled={disabled}
                value={resolved.gradientColors.to}
                onChange={(e) =>
                  patch({
                    gradientColors: { ...resolved.gradientColors!, to: e.target.value },
                  })
                }
                className="w-10 h-9 rounded border border-slate-300"
              />
              <input
                type="text"
                disabled={disabled}
                value={resolved.gradientColors.to}
                onChange={(e) =>
                  patch({
                    gradientColors: { ...resolved.gradientColors!, to: e.target.value },
                  })
                }
                className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm font-mono"
              />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg overflow-hidden border border-slate-200">
        <p className="text-xs text-slate-500 px-3 py-2 bg-slate-50 border-b border-slate-100">
          Banner preview
        </p>
        <OpportunityBannerDisplay
          opportunity={{ kind, title: title || 'Untitled opportunity', banner: resolved }}
          compact
        />
      </div>
    </div>
  );
};

export default OpportunityBannerEditor;
