import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Palette, Type } from 'lucide-react';
import type { AboutConfig, AboutDesignId } from '../../../../types';
import { isArabic } from '../../../../utils/languageDetection';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import './aboutSection.css';

const DESIGNS: AboutDesignId[] = ['classic', 'stage', 'editorial'];

export function withAboutDesign(about: AboutConfig | undefined, design: AboutDesignId): AboutConfig {
  return {
    includeImage: false,
    imageUrl: '',
    layout: 'top',
    ...about,
    design,
  };
}

interface AboutSectionProps {
  title: string;
  description: string;
  titleAlignment?: 'left' | 'center' | 'right';
  aboutConfig?: AboutConfig;
  /** Builder preview only. Published pages render the chosen design without this control. */
  showDesignPicker?: boolean;
  onDesignChange?: (design: AboutDesignId) => void;
}

function alignClass(alignment: AboutSectionProps['titleAlignment']): string {
  if (alignment === 'left') return 'text-left';
  if (alignment === 'right') return 'text-right';
  return 'text-center';
}

function justifyClass(alignment: AboutSectionProps['titleAlignment']): string {
  if (alignment === 'left') return 'justify-start';
  if (alignment === 'right') return 'justify-end';
  return 'justify-center';
}

const AboutTitle: React.FC<{
  title: string;
  alignment: AboutSectionProps['titleAlignment'];
  tone?: 'ink' | 'light';
  className?: string;
}> = ({ title, alignment, tone = 'ink', className = '' }) => {
  const arabic = isArabic(title);
  const color = tone === 'light' ? 'text-white' : 'text-slate-900';
  const icon = tone === 'light' ? 'text-indigo-200' : 'text-indigo-600';
  return (
    <h2
      className={`text-3xl sm:text-4xl font-bold leading-tight flex items-center gap-3 ${color} ${alignClass(alignment)} ${justifyClass(alignment)} ${arabic ? 'flex-row-reverse' : ''} ${className}`}
    >
      {arabic ? (
        <>
          <span>{title}</span>
          <Type size={32} className={`${icon} shrink-0`} />
        </>
      ) : (
        <>
          <Type size={32} className={`${icon} shrink-0`} />
          <span>{title}</span>
        </>
      )}
    </h2>
  );
};

const Photo: React.FC<{
  src: string;
  className?: string;
  imgClassName?: string;
}> = ({ src, className = '', imgClassName = '' }) => (
  <div className={`overflow-hidden ${className}`}>
    <div className="lp-about-kenburns h-full w-full">
      <img src={src} alt="" className={`h-full w-full object-cover ${imgClassName}`} />
    </div>
  </div>
);

function paragraphs(text: string): string[] {
  const parts = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts : text.trim() ? [text] : [];
}

const ClassicAbout: React.FC<{
  title: string;
  description: string;
  alignment: AboutSectionProps['titleAlignment'];
  about: AboutConfig;
}> = ({ title, description, alignment, about }) => {
  const hasImage = about.includeImage && Boolean(about.imageUrl);
  const titleNode = <AboutTitle title={title} alignment={alignment} className="mb-8" />;
  const copy = <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{description}</p>;
  const image = hasImage ? (
    <div className="group overflow-hidden rounded-lg">
      <img
        src={about.imageUrl}
        alt=""
        className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    </div>
  ) : null;

  if (!hasImage) {
    return (
      <div className="py-16 sm:py-24 px-4 sm:px-8 max-w-4xl mx-auto">
        {titleNode}
        {copy}
      </div>
    );
  }

  if (about.layout === 'left-right' || about.layout === 'right-left') {
    const imageFirst = about.layout === 'right-left';
    const textCol = <div>{copy}</div>;
    const imageCol = <div>{image}</div>;
    return (
      <div className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
        {titleNode}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {imageFirst ? imageCol : textCol}
          {imageFirst ? textCol : imageCol}
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
      {titleNode}
      <div className="mb-8">{image}</div>
      {copy}
    </div>
  );
};

const StageAbout: React.FC<{
  title: string;
  description: string;
  alignment: AboutSectionProps['titleAlignment'];
  about: AboutConfig;
}> = ({ title, description, alignment, about }) => {
  const hasImage = about.includeImage && Boolean(about.imageUrl);
  const textAlign = alignClass(alignment);
  const items =
    alignment === 'left' ? 'items-start' : alignment === 'right' ? 'items-end' : 'items-center';

  const reveal =
    'translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100';

  if (!hasImage) {
    return (
      <div className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
        <div
          tabIndex={0}
          className={`group relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-slate-900 px-8 py-20 sm:px-14 sm:py-24 outline-none ${textAlign}`}
        >
          <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-indigo-500/30 blur-2xl transition-transform duration-700 group-hover:scale-125" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl" />
          <div className={`relative flex flex-col ${items} ${reveal}`}>
            <AboutTitle title={title} alignment={alignment} tone="light" />
            <div className="mt-5 h-1 w-16 origin-left rounded-full bg-indigo-400" />
            <p className="mt-6 max-w-2xl text-slate-200 leading-relaxed whitespace-pre-wrap">{description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
      <AboutTitle title={title} alignment="center" className="mb-8" />
      <div
        tabIndex={0}
        className="group relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-slate-900 shadow-xl outline-none"
      >
        <Photo
          src={about.imageUrl}
          className="h-80 sm:h-[28rem]"
          imgClassName="transition-transform duration-700 group-hover:scale-105 group-focus-within:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-slate-900/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100" />
        <p
          className={`absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-lg backdrop-blur-sm whitespace-pre-wrap ${reveal}`}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

const EditorialAbout: React.FC<{
  title: string;
  description: string;
  alignment: AboutSectionProps['titleAlignment'];
  about: AboutConfig;
}> = ({ title, description, alignment, about }) => {
  const hasImage = about.includeImage && Boolean(about.imageUrl);
  const arabic = isArabic(title) || isArabic(description);
  const blocks = paragraphs(description);
  const lead = blocks[0] || '';
  const rest = blocks.slice(1);
  const dropCap = lead && !arabic ? lead.slice(0, 1) : '';
  const leadBody = dropCap ? lead.slice(1) : lead;

  const copy = (
    <div>
      <AboutTitle title={title} alignment={alignment} />
      <div
        className={`mt-4 h-1 w-20 rounded-full bg-indigo-600 lp-about-draw ${arabic ? 'origin-right ml-auto' : 'origin-left'}`}
      />
      {lead ? (
        <p
          className="lp-about-rise mt-6 text-lg sm:text-xl text-slate-800 leading-relaxed whitespace-pre-wrap"
          style={{ animationDelay: '80ms' }}
        >
          {dropCap ? (
            <span className="float-left mr-2 mt-1 font-serif text-5xl leading-none text-indigo-600">
              {dropCap}
            </span>
          ) : null}
          {leadBody}
        </p>
      ) : null}
      {rest.map((block, index) => (
        <p
          key={index}
          className="lp-about-rise mt-4 text-slate-600 leading-relaxed whitespace-pre-wrap"
          style={{ animationDelay: `${180 + index * 90}ms` }}
        >
          {block}
        </p>
      ))}
    </div>
  );

  if (!hasImage) {
    return (
      <div className="py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto border-y border-indigo-100 py-12">{copy}</div>
      </div>
    );
  }

  const frame = (
    <div className="group relative">
      <div className="absolute -inset-3 rounded-[1.75rem] bg-indigo-100 transition-transform duration-500 -rotate-2 group-hover:rotate-0" />
      <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-2xl border-2 border-indigo-300/80 transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1" />
      <Photo
        src={about.imageUrl}
        className="relative h-80 sm:h-[28rem] rounded-3xl shadow-xl"
        imgClassName="transition duration-700 group-hover:scale-105"
      />
    </div>
  );

  if (about.layout === 'top') {
    return (
      <div className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
        {frame}
        {copy}
      </div>
    );
  }

  const imageFirst = about.layout === 'right-left';
  return (
    <div className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
        {imageFirst ? frame : copy}
        {imageFirst ? copy : frame}
      </div>
    </div>
  );
};

const Thumb: React.FC<{ design: AboutDesignId }> = ({ design }) => {
  if (design === 'stage') {
    return (
      <div className="relative h-14 w-full overflow-hidden rounded-md bg-indigo-200">
        <div className="absolute inset-x-1.5 bottom-1.5 h-5 rounded bg-white/85" />
      </div>
    );
  }
  if (design === 'editorial') {
    return (
      <div className="flex h-14 w-full items-center gap-1.5">
        <div className="h-12 w-1/2 -rotate-6 rounded-md bg-indigo-200" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-4/5 rounded bg-slate-300" />
          <div className="h-1 rounded bg-slate-200" />
          <div className="h-1 w-3/4 rounded bg-slate-200" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-14 w-full flex-col justify-center gap-1">
      <div className="h-1.5 w-2/3 rounded bg-slate-300" />
      <div className="h-6 rounded bg-indigo-200" />
      <div className="h-1 rounded bg-slate-200" />
      <div className="h-1 w-4/5 rounded bg-slate-200" />
    </div>
  );
};

const AboutDesignPicker: React.FC<{
  design: AboutDesignId;
  onChange: (design: AboutDesignId) => void;
}> = ({ design, onChange }) => {
  const { t } = useAdminTranslation('pageBuilder');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const labelFor = (id: AboutDesignId) => {
    if (id === 'stage') return { name: t('aboutDesignStage'), hint: t('aboutDesignStageHint') };
    if (id === 'editorial') return { name: t('aboutDesignEditorial'), hint: t('aboutDesignEditorialHint') };
    return { name: t('aboutDesignClassic'), hint: t('aboutDesignClassicHint') };
  };

  return (
    <div ref={rootRef} className="absolute top-3 right-3 z-30">
      <button
        type="button"
        aria-label={t('aboutDesignOpen')}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-600 shadow-md transition-colors hover:border-indigo-300 hover:bg-indigo-50"
      >
        <Palette size={16} />
      </button>
      {open ? (
        <div
          id={panelId}
          role="listbox"
          aria-label={t('aboutDesignTitle')}
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t('aboutDesignTitle')}
          </p>
          <div className="space-y-1">
            {DESIGNS.map((id) => {
              const selected = id === design;
              const copy = labelFor(id);
              return (
                <button
                  key={id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-2 py-2 text-left transition-colors ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-24 shrink-0 rounded-lg border border-slate-100 bg-slate-50 p-1.5">
                    <Thumb design={id} />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{copy.name}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">{copy.hint}</span>
                  </span>
                  {selected ? <Check size={16} className="shrink-0 text-indigo-600" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const AboutSection: React.FC<AboutSectionProps> = ({
  title,
  description,
  titleAlignment = 'center',
  aboutConfig,
  showDesignPicker = false,
  onDesignChange,
}) => {
  const about: AboutConfig = {
    includeImage: false,
    imageUrl: '',
    layout: 'top',
    ...aboutConfig,
  };
  const design: AboutDesignId = about.design || 'classic';

  return (
    <section className="relative bg-white">
      {showDesignPicker && onDesignChange ? (
        <AboutDesignPicker design={design} onChange={onDesignChange} />
      ) : null}
      <div key={design}>
        {design === 'stage' ? (
          <StageAbout title={title} description={description} alignment={titleAlignment} about={about} />
        ) : design === 'editorial' ? (
          <EditorialAbout title={title} description={description} alignment={titleAlignment} about={about} />
        ) : (
          <ClassicAbout title={title} description={description} alignment={titleAlignment} about={about} />
        )}
      </div>
    </section>
  );
};

export default AboutSection;
