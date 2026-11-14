import React from 'react';
import type { AiPosterGeneralInfo } from './types';

type AiPosterComposedProps = {
  info: AiPosterGeneralInfo;
  width: number;
  height: number;
  /** Optional OpenAI-generated background / style layer */
  backgroundDataUrl?: string | null;
  /** Hide helper captions for export capture */
  forExport?: boolean;
};

/**
 * Print layout that always embeds the user's banner, speaker photos, and logos.
 * OpenAI output is used as an atmospheric background, not as a replacement for assets.
 */
const AiPosterComposed: React.FC<AiPosterComposedProps> = ({
  info,
  width,
  height,
  backgroundDataUrl,
  forExport = false,
}) => {
  const speakers = info.speakers.filter((s) => s.enabled && s.name.trim()).slice(0, 4);
  const organizerLogos = info.organizerLogos.filter((l) => l.image);
  const partnerLogos = info.partnerLogos.filter((l) => l.image);
  const hasBanner = Boolean(info.bannerImage);
  const titleSize = Math.max(32, Math.round(width * 0.058));
  const sloganSize = Math.max(13, Math.round(width * 0.024));

  return (
    <div
      data-ai-poster-composed
      className="relative overflow-hidden text-white"
      style={{
        width,
        height,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backgroundColor: '#0b1220',
      }}
    >
      {backgroundDataUrl ? (
        <img
          src={backgroundDataUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(155deg, #0f172a 0%, #1e293b 42%, #0f766e 100%)',
          }}
        />
      )}

      {/* Darken AI bg so text/assets stay readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,12,24,0.72) 0%, rgba(8,12,24,0.55) 40%, rgba(8,15,20,0.88) 100%)',
        }}
      />

      <div
        className="relative flex h-full flex-col"
        style={{ padding: Math.round(width * 0.055), gap: Math.round(height * 0.018) }}
      >
        {!forExport && !backgroundDataUrl && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-teal-200/90">
            AI draft preview
          </div>
        )}

        {/* Banner */}
        {hasBanner && (
          <div
            className="shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)]"
            style={{ height: Math.round(height * 0.22) }}
          >
            <img
              src={info.bannerImage}
              alt=""
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
        )}

        {/* Title block */}
        <div className="shrink-0">
          <h1
            className="font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: titleSize }}
          >
            {info.title || 'Event title'}
          </h1>
          {info.slogan && (
            <p className="mt-2 italic text-teal-100/95" style={{ fontSize: sloganSize }}>
              {info.slogan}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {info.date && (
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium">
                {info.date}
              </span>
            )}
            {info.place && (
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium">
                {info.place}
              </span>
            )}
          </div>
        </div>

        {/* Speakers with real photos */}
        {speakers.length > 0 && (
          <div className="min-h-0 flex-1">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-teal-200/85">
              Speakers
            </div>
            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: speakers.length === 1 ? '1fr' : '1fr 1fr',
              }}
            >
              {speakers.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-sm"
                >
                  <div
                    className="shrink-0 overflow-hidden rounded-full bg-white/20 ring-2 ring-teal-300/40"
                    style={{
                      width: Math.round(width * 0.09),
                      height: Math.round(width * 0.09),
                    }}
                  >
                    {s.image ? (
                      <img
                        src={s.image}
                        alt={s.name}
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold">
                        {s.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-bold leading-tight">{s.name}</div>
                    {s.position && (
                      <div className="truncate text-[10px] text-white/80">{s.position}</div>
                    )}
                    {s.establishment && (
                      <div className="truncate text-[10px] text-white/55">{s.establishment}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logos footer */}
        <div className="mt-auto shrink-0 space-y-2 border-t border-white/15 pt-3">
          {organizerLogos.length > 0 && (
            <div>
              <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/55">
                Organizers
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {organizerLogos.map((logo) => (
                  <div
                    key={logo.id}
                    className="flex h-10 items-center rounded-lg bg-white/95 px-2 py-1"
                    title={logo.name}
                  >
                    <img
                      src={logo.image}
                      alt={logo.name}
                      className="h-8 w-auto max-w-[90px] object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {partnerLogos.length > 0 && (
            <div>
              <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/55">
                Partners
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {partnerLogos.map((logo) => (
                  <div
                    key={logo.id}
                    className="flex h-9 items-center rounded-lg bg-white/95 px-2 py-1"
                    title={logo.name}
                  >
                    <img
                      src={logo.image}
                      alt={logo.name}
                      className="h-7 w-auto max-w-[80px] object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {!forExport && !backgroundDataUrl && (
            <p className="text-[10px] text-white/45">
              Generate with OpenAI to add an AI-designed background behind your assets.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiPosterComposed;
