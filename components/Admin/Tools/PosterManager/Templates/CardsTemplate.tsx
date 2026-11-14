import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Clock, MapPin, Mail, Phone, Globe, Award, Leaf } from 'lucide-react';
import PosterTemplateViewport from '../PosterTemplateViewport';
import { POSTER_REF_HEIGHT, POSTER_REF_WIDTH } from '../posterTemplateLayout';
import type { PosterData } from '../posterTemplateTypes';

type CardsTemplateProps = {
  data: PosterData;
  width: number;
  height: number;
};

const PAD = 28;
const GAP = 12;

export function CardsTemplate({ data, width, height }: CardsTemplateProps) {
  const speakers = data.speakers.filter((s) => s.name || s.image);
  const topics = data.topics.filter(Boolean);

  return (
    <PosterTemplateViewport width={width} height={height}>
      <div
        className="relative overflow-hidden bg-[#f5f0e8] text-[#2b3a2b]"
        style={{
          width: POSTER_REF_WIDTH,
          height: POSTER_REF_HEIGHT,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div
          className="grid h-full"
          style={{
            padding: PAD,
            gap: GAP,
            gridTemplateRows: '52px 268px 84px minmax(0, 1fr) 132px',
          }}
        >
          {/* Header */}
          <div className="flex min-h-0 items-center justify-between rounded-2xl bg-white/70 px-4 py-2 shadow-[0_8px_30px_rgba(45,90,61,0.08)] backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              {data.logo && (
                <img
                  src={data.logo}
                  alt=""
                  crossOrigin="anonymous"
                  className="h-10 w-10 shrink-0 rounded-xl object-contain"
                />
              )}
              <div className="min-w-0">
                <div className="truncate text-[10px] font-semibold uppercase tracking-[0.3em] text-[#5a8a5c]">
                  {data.organizer}
                </div>
                <div className="truncate text-[10px] text-[#7d9b76]">Workshop &amp; Training Series</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#a8c0a0] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#1a3c2a]">
              <Leaf className="h-3 w-3" /> {data.date}
            </div>
          </div>

          {/* Hero */}
          <div className="grid min-h-0 gap-3" style={{ gridTemplateColumns: '1.15fr 1fr' }}>
            <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-[0_12px_40px_rgba(45,90,61,0.1)]">
              <div className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c17c74]">
                Featured programme
              </div>
              <h1
                className="mt-1.5 shrink-0 font-bold leading-[1.05] tracking-tight text-[#1a3c2a] line-clamp-3"
                style={{ fontSize: 34, fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {data.title}
              </h1>
              {data.subtitle && (
                <p className="mt-1 shrink-0 text-xs italic text-[#5a8a5c] line-clamp-1">{data.subtitle}</p>
              )}
              <p className="mt-2 min-h-0 flex-1 overflow-hidden text-[11px] leading-snug text-[#3a4a3a] line-clamp-4">
                {data.description}
              </p>
            </div>

            <div className="min-h-0 overflow-hidden rounded-3xl bg-[#dce5d4] shadow-[0_12px_40px_rgba(45,90,61,0.1)]">
              {data.themeImage ? (
                <img
                  src={data.themeImage}
                  alt=""
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#7d9b76]">
                  <Leaf className="h-14 w-14" />
                </div>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="grid min-h-0 grid-cols-3 gap-3">
            <MetaCard icon={<Calendar className="h-3.5 w-3.5" />} label="When" value={data.date} sub={data.time} />
            <MetaCard
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Where"
              value={data.location}
              sub={data.venueDetails}
            />
            <MetaCard
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Register by"
              value={data.registrationDeadline}
              sub={data.seatsInfo}
            />
          </div>

          {/* Detail row */}
          <div className="grid min-h-0 gap-3" style={{ gridTemplateColumns: '1fr 1.25fr' }}>
            <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(45,90,61,0.08)]">
              <div className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c17c74]">
                What you&apos;ll explore
              </div>
              <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-hidden">
                {topics.slice(0, 5).map((t, i) => (
                  <li key={i} className="flex gap-2 border-b border-[#dce5d4] pb-1 last:border-0">
                    <span className="shrink-0 text-base leading-none text-[#a8c0a0]">·</span>
                    <span className="text-[11px] leading-snug text-[#2b3a2b] line-clamp-2">{t}</span>
                  </li>
                ))}
              </ul>
              {data.targetAudience && (
                <div className="mt-2 shrink-0 rounded-xl bg-[#f5f0e8] p-2.5">
                  <div className="text-[9px] font-semibold uppercase tracking-widest text-[#5a8a5c]">For whom</div>
                  <p className="mt-0.5 text-[10px] leading-snug text-[#3a4a3a] line-clamp-2">{data.targetAudience}</p>
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(45,90,61,0.08)]">
              <div className="mb-2 flex shrink-0 items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c17c74]">Speakers</div>
                {data.certificate && (
                  <div className="flex items-center gap-1 rounded-full bg-[#a8c0a0]/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#1a3c2a]">
                    <Award className="h-3 w-3" /> Certificate
                  </div>
                )}
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 content-start">
                {speakers.slice(0, 4).map((s) => (
                  <div key={s.id} className="rounded-2xl bg-[#f5f0e8] p-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-[#a8c0a0]">
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={s.name}
                            crossOrigin="anonymous"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#dce5d4] text-xs font-bold text-[#5a8a5c]">
                            {s.name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[10px] font-bold leading-tight text-[#1a3c2a]">{s.name}</div>
                        <div className="truncate text-[9px] text-[#5a8a5c]">{s.title}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="min-h-0 overflow-hidden rounded-3xl bg-[#1a3c2a] px-4 py-3 text-white shadow-[0_12px_40px_rgba(45,90,61,0.15)]">
            <div className="flex h-full items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                {data.ctaText && (
                  <div className="inline-block rounded-full bg-white px-5 py-2 text-xs font-bold text-[#1a3c2a]">
                    {data.ctaText}
                  </div>
                )}
                {data.pricing && (
                  <div className="text-[10px] font-semibold text-[#c9e0c2] line-clamp-1">{data.pricing}</div>
                )}
                <div className="grid grid-cols-3 gap-2 text-[9px] text-white/80">
                  {data.contactEmail && (
                    <div className="flex min-w-0 items-center gap-1 truncate">
                      <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{data.contactEmail}</span>
                    </div>
                  )}
                  {data.contactPhone && (
                    <div className="flex min-w-0 items-center gap-1 truncate">
                      <Phone className="h-3 w-3 shrink-0" /> <span className="truncate">{data.contactPhone}</span>
                    </div>
                  )}
                  {data.contactWebsite && (
                    <div className="flex min-w-0 items-center gap-1 truncate">
                      <Globe className="h-3 w-3 shrink-0" /> <span className="truncate">{data.contactWebsite}</span>
                    </div>
                  )}
                </div>
                {data.partnerLogos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-[8px] uppercase tracking-widest text-white/50">Partners</span>
                    {data.partnerLogos.map((p) => (
                      <img
                        key={p.id}
                        src={p.image}
                        alt={p.name}
                        crossOrigin="anonymous"
                        className="h-5 w-auto object-contain brightness-0 invert"
                      />
                    ))}
                  </div>
                )}
              </div>
              {data.ctaUrl && (
                <div className="flex shrink-0 flex-col items-center gap-0.5">
                  <div className="rounded-xl bg-white p-1.5">
                    <QRCodeSVG value={data.ctaUrl} size={64} level="M" />
                  </div>
                  <div className="text-[8px] font-semibold uppercase tracking-widest text-[#c9e0c2]">
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
    <div className="flex min-h-0 flex-col justify-center overflow-hidden rounded-2xl bg-white px-3 py-2.5 shadow-[0_8px_30px_rgba(45,90,61,0.08)]">
      <div className="flex items-center gap-1.5 text-[#c17c74]">
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-0.5 truncate text-xs font-bold text-[#1a3c2a]">{value || '—'}</div>
      {sub && <div className="truncate text-[9px] text-[#5a8a5c]">{sub}</div>}
    </div>
  );
}
