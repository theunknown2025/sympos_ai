import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Droplets,
  Minus,
  Palette,
  Plus,
  Type,
} from 'lucide-react';
import {
  POSTER_FONTS,
  POSTER_TEXT_COLORS,
  ensurePosterFontsLoaded,
  stepFontSizeMm,
} from './posterFontCatalog';
import type { PosterTextItem } from './types';

type PosterTextEditorToolbarProps = {
  item: PosterTextItem;
  onUpdate: (patch: Partial<PosterTextItem>) => void;
};

function IconButton({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md border transition-colors ${
        active
          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
          : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-200 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

const PosterTextEditorToolbar: React.FC<PosterTextEditorToolbarProps> = ({ item, onUpdate }) => {
  const [fontOpen, setFontOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [opacityOpen, setOpacityOpen] = useState(false);
  const fontRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const currentFont = POSTER_FONTS.find((font) => font.id === item.fontFamilyId) ?? POSTER_FONTS[0];

  useEffect(() => {
    ensurePosterFontsLoaded();
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(event.target as Node)) setFontOpen(false);
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) setColorOpen(false);
      if (opacityRef.current && !opacityRef.current.contains(event.target as Node)) setOpacityOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Typography</p>
      <div className="flex flex-wrap items-center gap-0.5 p-1 rounded-lg border border-slate-200 bg-slate-50/60">
        <div className="relative" ref={fontRef}>
          <button
            type="button"
            onClick={() => setFontOpen((open) => !open)}
            title="Font family"
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 max-w-[6.5rem]"
            style={{ fontFamily: currentFont.family }}
          >
            <Type size={13} className="shrink-0 text-slate-500" />
            <span className="truncate">{currentFont.label}</span>
            <ChevronDown size={12} className="shrink-0 text-slate-400" />
          </button>
          {fontOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 w-44 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1">
              {POSTER_FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    onUpdate({ fontFamilyId: font.id });
                    setFontOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-indigo-50 ${
                    item.fontFamilyId === font.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        <IconButton
          title="Decrease size"
          onClick={() => onUpdate({ fontSizeMm: stepFontSizeMm(item.fontSizeMm, -1) })}
        >
          <Minus size={14} />
        </IconButton>
        <span className="text-xs font-semibold text-slate-700 tabular-nums min-w-[2rem] text-center">
          {item.fontSizeMm}
        </span>
        <IconButton
          title="Increase size"
          onClick={() => onUpdate({ fontSizeMm: stepFontSizeMm(item.fontSizeMm, 1) })}
        >
          <Plus size={14} />
        </IconButton>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        <div className="relative" ref={colorRef}>
          <IconButton title="Text color" active={colorOpen} onClick={() => setColorOpen((open) => !open)}>
            <span className="relative">
              <Palette size={14} />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white"
                style={{ backgroundColor: item.color }}
              />
            </span>
          </IconButton>
          {colorOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 rounded-lg border border-slate-200 bg-white shadow-lg p-2">
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {POSTER_TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => {
                      onUpdate({ color });
                      setColorOpen(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 ${
                      item.color === color ? 'border-indigo-500 scale-110' : 'border-slate-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="w-full text-[10px] text-slate-600 hover:text-indigo-600 py-1"
              >
                Custom color…
              </button>
              <input
                ref={colorInputRef}
                type="color"
                value={item.color}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="sr-only"
              />
            </div>
          )}
        </div>

        <IconButton
          title="Bold"
          active={item.fontWeight === 'bold'}
          onClick={() =>
            onUpdate({ fontWeight: item.fontWeight === 'bold' ? 'normal' : 'bold' })
          }
        >
          <Bold size={14} />
        </IconButton>

        <IconButton
          title="Align left"
          active={item.textAlign === 'left'}
          onClick={() => onUpdate({ textAlign: 'left' })}
        >
          <AlignLeft size={14} />
        </IconButton>
        <IconButton
          title="Align center"
          active={item.textAlign === 'center'}
          onClick={() => onUpdate({ textAlign: 'center' })}
        >
          <AlignCenter size={14} />
        </IconButton>
        <IconButton
          title="Align right"
          active={item.textAlign === 'right'}
          onClick={() => onUpdate({ textAlign: 'right' })}
        >
          <AlignRight size={14} />
        </IconButton>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        <div className="relative" ref={opacityRef}>
          <IconButton title="Opacity" active={opacityOpen} onClick={() => setOpacityOpen((open) => !open)}>
            <span className="relative">
              <Droplets size={14} />
              <span className="absolute -bottom-1 -right-1 text-[8px] font-bold text-slate-500">
                {item.opacity}
              </span>
            </span>
          </IconButton>
          {opacityOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 rounded-lg border border-slate-200 bg-white shadow-lg p-1 flex gap-0.5">
              {[100, 75, 50, 25].map((opacity) => (
                <button
                  key={opacity}
                  type="button"
                  onClick={() => {
                    onUpdate({ opacity });
                    setOpacityOpen(false);
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-medium ${
                    item.opacity === opacity
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opacity}%
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PosterTextEditorToolbar;
