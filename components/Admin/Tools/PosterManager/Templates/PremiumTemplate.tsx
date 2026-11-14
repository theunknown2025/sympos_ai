import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Clock, Mail, Phone, Globe, Award, Users, AlertCircle } from 'lucide-react';
import PosterTemplateViewport from '../PosterTemplateViewport';
import { POSTER_REF_HEIGHT, POSTER_REF_WIDTH } from '../posterTemplateLayout';
import type { PosterData } from '../posterTemplateTypes';

type PremiumTemplateProps = {
  data: PosterData;
  width: number;
  height: number;
};

const PAD = 36;
const GAP = 14;

export function PremiumTemplate({ data, width, height }: PremiumTemplateProps) {
  const visibleSpeakers = data.speakers.filter((s) => s.name || s.image);
  const topics = data.topics.filter(Boolean);
  const hasThemeImage = Boolean(data.themeImage);

  return (
    <PosterTemplateViewport width={width} height={height}>
      <div
        className="relative overflow-hidden text-white"
        style={{
          width: POSTER_REF_WIDTH,
          height: POSTER_REF_HEIGHT,
          backgroundColor: '#0a0f1e',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {data.backgroundImage && (
          <img
            src={data.backgroundImage}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(15,20,45,0.85) 0%, rgba(10,15,30,0.92) 60%, rgba(8,12,25,0.98) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 60%)' }}
        />

        <div
          className="relative grid h-full"
          style={{
            padding: PAD,
            gap: GAP,
            gridTemplateRows: hasThemeImage
              ? '56px 160px minmax(0, 1fr) 72px minmax(0, 0.9fr) 128px'
              : '56px minmax(0, 1fr) 72px minmax(0, 0.9fr) 128px',
          }}
        >
          {/* Header */}
          <header className="flex min-h-0 items-start justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {data.logo && (
                <img
                  src={data.logo}
                  alt="logo"
                  crossOrigin="anonymous"
                  className="h-12 w-12 shrink-0 rounded-md bg-white/10 object-contain p-1"
                />
              )}
              <div className="truncate text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">
                {data.organizer || 'Scientific Workshop'}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <div className="rounded-full border border-[#d4af37]/40 px-3 py-1 text-[9px] uppercase tracking-[0.3em] text-[#d4af37]">
                International · Workshop
              </div>
              {data.certificate && (
                <div className="flex items-center gap-1 rounded-full bg-[#d4af37]/10 px-3 py-1 text-[9px] uppercase tracking-widest text-[#d4af37]">
                  <Award className="h-3 w-3" /> Certificate Included
                </div>
              )}
            </div>
          </header>

          {/* Theme image */}
          {hasThemeImage && (
            <div className="min-h-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(212,175,55,0.35)]">
              <img
                src={data.themeImage}
                alt="theme"
                crossOrigin="anonymous"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Title block */}
          <div className="flex min-h-0 flex-col overflow-hidden" style={{ paddingRight: 48 }}>
            <div className="shrink-0 text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">
              Keynote · Presentations · Panels
            </div>
            <h1
              className="mt-1 shrink-0 font-bold leading-[1.02] tracking-tight line-clamp-3"
              style={{ fontSize: 46, fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {data.title || 'Your Workshop Title'}
            </h1>
            {data.subtitle && (
              <p className="mt-1 shrink-0 text-base italic text-[#d4af37]/90 line-clamp-1">{data.subtitle}</p>
            )}
            {data.description && (
              <p className="mt-2 min-h-0 flex-1 overflow-hidden text-sm leading-snug text-white/75 line-clamp-4">
                {data.description}
              </p>
            )}
          </div>

          {/* Meta row */}
          <div className="grid min-h-0 grid-cols-3 gap-2">
            <MetaCard icon={<Calendar className="h-3.5 w-3.5" />} label="Date" value={data.date || 'TBA'} />
            <MetaCard icon={<Clock className="h-3.5 w-3.5" />} label="Time" value={data.time || 'TBA'} />
            <MetaCard
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Location"
              value={data.location || 'TBA'}
              sub={data.venueDetails}
            />
          </div>

          {/* Middle content */}
          <div className="grid min-h-0 gap-2" style={{ gridTemplateRows: 'auto minmax(0, 1fr)' }}>
            {(data.targetAudience || topics.length > 0) && (
              <div className="grid min-h-0 grid-cols-2 gap-2">
                {data.targetAudience && (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <div className="flex items-center gap-2 text-[#d4af37]">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-[9px] uppercase tracking-widest">Who it&apos;s for</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-white/90 line-clamp-3">{data.targetAudience}</p>
                  </div>
                )}
                {topics.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <div className="text-[9px] uppercase tracking-widest text-[#d4af37]">Program Highlights</div>
                    <ul className="mt-1 space-y-0.5">
                      {topics.slice(0, 4).map((t, i) => (
                        <li key={i} className="text-[11px] text-white/90 line-clamp-1">
                          <span className="text-[#d4af37]">›</span> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {visibleSpeakers.length > 0 && (
              <div className="flex min-h-0 flex-col overflow-hidden">
                <h3 className="mb-2 shrink-0 text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">
                  Featured Speakers
                </h3>
                <div
                  className="grid min-h-0 flex-1 gap-2"
                  style={{ gridTemplateColumns: `repeat(${Math.min(visibleSpeakers.length, 4)}, minmax(0, 1fr))` }}
                >
                  {visibleSpeakers.slice(0, 4).map((s) => (
                    <div key={s.id} className="min-w-0 text-center">
                      <div className="mx-auto mb-1.5 h-16 w-16 overflow-hidden rounded-full border-2 border-[#d4af37]/60 bg-white/5">
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={s.name}
                            crossOrigin="anonymous"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg text-white/40">
                            {s.name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="truncate text-[11px] font-semibold leading-tight">{s.name || 'Speaker'}</div>
                      <div className="truncate text-[9px] text-white/60">{s.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(data.registrationDeadline || data.seatsInfo || data.pricing) && (
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {data.registrationDeadline && (
                  <Pill
                    icon={<AlertCircle className="h-3 w-3" />}
                    text={`Registration closes: ${data.registrationDeadline}`}
                  />
                )}
                {data.seatsInfo && <Pill icon={<Users className="h-3 w-3" />} text={data.seatsInfo} />}
                {data.pricing && <Pill text={data.pricing} />}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex min-h-0 flex-col justify-end overflow-hidden">
            {data.partnerLogos.length > 0 && (
              <div className="mb-2 shrink-0 border-t border-white/10 pt-2">
                <div className="mb-1 text-[9px] uppercase tracking-[0.3em] text-white/50">In partnership with</div>
                <div className="flex flex-wrap items-center gap-3">
                  {data.partnerLogos.map((p) => (
                    <img
                      key={p.id}
                      src={p.image}
                      alt={p.name}
                      crossOrigin="anonymous"
                      className="h-8 w-auto object-contain opacity-90"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                {data.ctaText && (
                  <div className="inline-block rounded-full bg-[#d4af37] px-6 py-2.5 text-sm font-bold text-[#0a0f1e] shadow-[0_20px_50px_-10px_rgba(212,175,55,0.5)]">
                    {data.ctaText}
                  </div>
                )}
                <div className="space-y-0.5 text-[10px] text-white/70">
                  {data.contactEmail && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3 shrink-0 text-[#d4af37]" /> {data.contactEmail}
                    </div>
                  )}
                  {data.contactPhone && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="h-3 w-3 shrink-0 text-[#d4af37]" /> {data.contactPhone}
                    </div>
                  )}
                  {data.contactWebsite && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Globe className="h-3 w-3 shrink-0 text-[#d4af37]" /> {data.contactWebsite}
                    </div>
                  )}
                </div>
              </div>
              {data.ctaUrl && (
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <div className="rounded-xl bg-white p-1.5">
                    <QRCodeSVG value={data.ctaUrl} size={72} level="M" />
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-[#d4af37]">
                    {data.qrLabel || 'Scan to Register'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PosterTemplateViewport>
  );
}

function MetaCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex min-h-0 flex-col justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[#d4af37]">
        {icon}
        <span className="text-[9px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-0.5 truncate text-[11px] font-semibold">{value}</div>
      {sub && <div className="truncate text-[9px] text-white/60">{sub}</div>}
    </div>
  );
}

function Pill({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-2.5 py-0.5 text-[10px] text-white">
      {icon && <span className="shrink-0 text-[#d4af37]">{icon}</span>}
      <span className="truncate">{text}</span>
    </div>
  );
}
