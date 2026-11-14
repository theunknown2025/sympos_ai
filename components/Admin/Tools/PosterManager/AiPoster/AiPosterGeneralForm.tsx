import React, { useRef } from 'react';
import { ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react';
import { createEmptySpeaker, DEFAULT_AI_POSTER_THEMES } from './defaults';
import { fileToDataUrl } from './aiPosterService';
import type { AiPosterGeneralInfo, AiPosterLogo, AiPosterSpeaker } from './types';

type AiPosterGeneralFormProps = {
  info: AiPosterGeneralInfo;
  onChange: (next: AiPosterGeneralInfo) => void;
};

async function pickImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

const fieldClass =
  'mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200';

const AiPosterGeneralForm: React.FC<AiPosterGeneralFormProps> = ({ info, onChange }) => {
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const patch = (partial: Partial<AiPosterGeneralInfo>) => onChange({ ...info, ...partial });

  const updateSpeaker = (id: string, partial: Partial<AiPosterSpeaker>) => {
    patch({
      speakers: info.speakers.map((s) => (s.id === id ? { ...s, ...partial } : s)),
    });
  };

  const removeSpeaker = (id: string) => {
    patch({ speakers: info.speakers.filter((s) => s.id !== id) });
  };

  const addLogo = async (kind: 'organizerLogos' | 'partnerLogos') => {
    const file = await pickImageFile();
    if (!file) return;
    const image = await fileToDataUrl(file);
    const logo: AiPosterLogo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name.replace(/\.[^.]+$/, ''),
      image,
    };
    patch({ [kind]: [...info[kind], logo] });
  };

  const updateLogo = (
    kind: 'organizerLogos' | 'partnerLogos',
    id: string,
    partial: Partial<AiPosterLogo>,
  ) => {
    patch({
      [kind]: info[kind].map((logo) => (logo.id === id ? { ...logo, ...partial } : logo)),
    });
  };

  const removeLogo = (kind: 'organizerLogos' | 'partnerLogos', id: string) => {
    patch({ [kind]: info[kind].filter((logo) => logo.id !== id) });
  };

  const updateTheme = (index: number, value: string) => {
    const themes = [...info.themes];
    themes[index] = value;
    patch({ themes });
  };

  const removeTheme = (index: number) => {
    patch({ themes: info.themes.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {/* Title / subtitle */}
      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Title & subtitle</p>
        <label className="block">
          <span className="text-[11px] font-medium text-slate-600">Main title</span>
          <input
            type="text"
            value={info.title}
            onChange={(e) => patch({ title: e.target.value })}
            className={fieldClass}
            placeholder="Social Innovation in Morocco"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-slate-600">Subtitle</span>
          <textarea
            value={info.slogan}
            onChange={(e) => patch({ slogan: e.target.value })}
            rows={2}
            className={fieldClass}
            placeholder="Empowering Communities Through Innovation…"
          />
        </label>
      </section>

      {/* Event info */}
      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Event information</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] font-medium text-slate-600">Date</span>
            <input
              type="text"
              value={info.date}
              onChange={(e) => patch({ date: e.target.value })}
              className={fieldClass}
              placeholder="September 25, 2026"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-slate-600">Time</span>
            <input
              type="text"
              value={info.time}
              onChange={(e) => patch({ time: e.target.value })}
              className={fieldClass}
              placeholder="09:00 – 17:30"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-[11px] font-medium text-slate-600">Location</span>
          <input
            type="text"
            value={info.place}
            onChange={(e) => patch({ place: e.target.value })}
            className={fieldClass}
            placeholder="Venue, city, country"
          />
        </label>
      </section>

      {/* About */}
      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">About the event</p>
        <textarea
          value={info.about}
          onChange={(e) => patch({ about: e.target.value })}
          rows={4}
          className={fieldClass}
          placeholder="Short paragraph describing the conference…"
        />
      </section>

      {/* Themes */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Key themes</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => patch({ themes: [...DEFAULT_AI_POSTER_THEMES] })}
              className="text-[10px] font-semibold text-slate-500 hover:text-slate-800"
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={() => patch({ themes: [...info.themes, ''] })}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          {info.themes.map((theme, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <input
                type="text"
                value={theme}
                onChange={(e) => updateTheme(index, e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                placeholder={`Theme ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeTheme(index)}
                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Speakers */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Featured speakers</p>
          <button
            type="button"
            onClick={() => patch({ speakers: [...info.speakers, createEmptySpeaker()] })}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {info.speakers.map((speaker, index) => (
            <div
              key={speaker.id}
              className={`rounded-lg border p-2.5 space-y-2 ${
                speaker.enabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={speaker.enabled}
                    onChange={(e) => updateSpeaker(speaker.id, { enabled: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Include speaker {index + 1}
                </label>
                <button
                  type="button"
                  onClick={() => removeSpeaker(speaker.id)}
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remove speaker"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {speaker.enabled && (
                <>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const file = await pickImageFile();
                        if (!file) return;
                        updateSpeaker(speaker.id, { image: await fileToDataUrl(file) });
                      }}
                      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:border-indigo-400"
                    >
                      {speaker.image ? (
                        <img src={speaker.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Upload size={16} className="text-slate-400" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={speaker.name}
                        onChange={(e) => updateSpeaker(speaker.id, { name: e.target.value })}
                        placeholder="Speaker name"
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={speaker.position}
                        onChange={(e) => updateSpeaker(speaker.id, { position: e.target.value })}
                        placeholder="Title"
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={speaker.establishment}
                    onChange={(e) => updateSpeaker(speaker.id, { establishment: e.target.value })}
                    placeholder="Institution"
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA + QR + Contact */}
      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Call to action & QR</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] font-medium text-slate-600">CTA</span>
            <input
              type="text"
              value={info.ctaText}
              onChange={(e) => patch({ ctaText: e.target.value })}
              className={fieldClass}
              placeholder="Register Now"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-slate-600">CTA note</span>
            <input
              type="text"
              value={info.ctaSubtext}
              onChange={(e) => patch({ ctaSubtext: e.target.value })}
              className={fieldClass}
              placeholder="Seats are Limited!"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-[11px] font-medium text-slate-600">QR label</span>
          <input
            type="text"
            value={info.qrLabel}
            onChange={(e) => patch({ qrLabel: e.target.value })}
            className={fieldClass}
            placeholder="Scan to Register"
          />
        </label>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact</p>
        <label className="block">
          <span className="text-[11px] font-medium text-slate-600">Website</span>
          <input
            type="text"
            value={info.contactWebsite}
            onChange={(e) => patch({ contactWebsite: e.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-slate-600">Email</span>
          <input
            type="text"
            value={info.contactEmail}
            onChange={(e) => patch({ contactEmail: e.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-slate-600">Phone</span>
          <input
            type="text"
            value={info.contactPhone}
            onChange={(e) => patch({ contactPhone: e.target.value })}
            className={fieldClass}
          />
        </label>
      </section>

      {/* Images */}
      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Images</p>
        <div>
          <span className="text-[11px] font-medium text-slate-600">Hero / banner reference (optional)</span>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              patch({ bannerImage: await fileToDataUrl(file) });
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="mt-1 flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-left hover:border-indigo-400"
          >
            {info.bannerImage ? (
              <img src={info.bannerImage} alt="" className="h-12 w-20 rounded object-cover" />
            ) : (
              <div className="flex h-12 w-20 items-center justify-center rounded bg-white border border-slate-200">
                <ImagePlus size={18} className="text-slate-400" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-700">
                {info.bannerImage ? 'Change reference image' : 'Upload reference image'}
              </p>
              <p className="text-[10px] text-slate-400">Optional — helps OpenAI hero illustration</p>
            </div>
          </button>
          {info.bannerImage && (
            <button
              type="button"
              onClick={() => patch({ bannerImage: '' })}
              className="mt-1 text-[11px] text-rose-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>

        <LogoList
          title="Organization logos (top)"
          logos={info.organizerLogos}
          onAdd={() => addLogo('organizerLogos')}
          onUpdate={(id, partial) => updateLogo('organizerLogos', id, partial)}
          onRemove={(id) => removeLogo('organizerLogos', id)}
        />
        <LogoList
          title="Partner logos (footer)"
          logos={info.partnerLogos}
          onAdd={() => addLogo('partnerLogos')}
          onUpdate={(id, partial) => updateLogo('partnerLogos', id, partial)}
          onRemove={(id) => removeLogo('partnerLogos', id)}
        />
      </section>
    </div>
  );
};

function LogoList({
  title,
  logos,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  logos: AiPosterLogo[];
  onAdd: () => void;
  onUpdate: (id: string, partial: Partial<AiPosterLogo>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-600">{title}</span>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <Plus size={12} /> Add logo
        </button>
      </div>
      {logos.length === 0 ? (
        <p className="text-[10px] text-slate-400">None added — OpenAI will use LOGO placeholders</p>
      ) : (
        <div className="space-y-1.5">
          {logos.map((logo) => (
            <div key={logo.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-1.5">
              <img src={logo.image} alt="" className="h-8 w-8 rounded object-contain bg-white" />
              <input
                type="text"
                value={logo.name}
                onChange={(e) => onUpdate(logo.id, { name: e.target.value })}
                className="min-w-0 flex-1 rounded border border-slate-200 px-1.5 py-0.5 text-[11px]"
                placeholder="Logo name"
              />
              <button
                type="button"
                onClick={() => onRemove(logo.id)}
                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AiPosterGeneralForm;
