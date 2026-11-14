import React from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Trash2 } from 'lucide-react';
import { PX_PER_MM } from './posterConstants';
import type { PosterImageBox, PosterImageItem } from './types';

function pxToMm(px: number) {
  return Math.round(px / PX_PER_MM);
}

type PosterImagesAccordionProps = {
  open: boolean;
  onToggle: () => void;
  images: PosterImageItem[];
  selectedImageId: string | null;
  expandedImageId: string | null;
  onAddImage: () => void;
  onSelectImage: (id: string) => void;
  onToggleImage: (id: string) => void;
  onUpdateImage: (id: string, patch: Partial<PosterImageItem>) => void;
  onUpdateBoxField: (id: string, field: keyof PosterImageBox, mmValue: number) => void;
  onImageFile: (id: string, file: File) => void;
  onDeleteImage: (id: string) => void;
  gridMm: number;
};

const PosterImagesAccordion: React.FC<PosterImagesAccordionProps> = ({
  open,
  onToggle,
  images,
  selectedImageId,
  expandedImageId,
  onAddImage,
  onSelectImage,
  onToggleImage,
  onUpdateImage,
  onUpdateBoxField,
  onImageFile,
  onDeleteImage,
  gridMm,
}) => (
  <div
    className={`border rounded-lg overflow-hidden transition-all ${
      open ? 'border-indigo-200 shadow-sm' : 'border-slate-200'
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-50 text-left"
    >
      <span className="font-semibold text-sm text-slate-800">Images</span>
      {open ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
    </button>

    {open && (
      <div className="p-3 bg-white border-t border-slate-100 space-y-3">
        <button
          type="button"
          onClick={onAddImage}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-700"
        >
          <ImagePlus size={16} />
          Add image
        </button>

        {images.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">No images yet.</p>
        )}

        {images.map((image) => {
          const isExpanded = expandedImageId === image.id;
          const isSelected = selectedImageId === image.id;

          return (
            <div
              key={image.id}
              className={`border rounded-lg overflow-hidden ${
                isSelected ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1 p-2 bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => {
                    onSelectImage(image.id);
                    onToggleImage(image.id);
                  }}
                  className="flex-1 flex items-center justify-between min-w-0 text-left px-1"
                >
                  <span className="text-sm font-medium text-slate-800 truncate">{image.label}</span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-500 shrink-0" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteImage(image.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                  aria-label={`Delete ${image.label}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {isExpanded && (
                <div className="p-3 space-y-3 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Frame position</p>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Drag on the page or edit values. Snaps to {gridMm} mm grid.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['x', 'y', 'width', 'height'] as const).map((field) => (
                        <label key={field} className="text-xs text-slate-600 capitalize">
                          {field}
                          <input
                            type="number"
                            min={field === 'x' || field === 'y' ? 0 : 1}
                            value={pxToMm(image.box[field])}
                            onChange={(e) => onUpdateBoxField(image.id, field, Number(e.target.value))}
                            className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                          />
                          <span className="text-[10px] text-slate-400">mm</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Image file</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImageFile(image.id, file);
                      }}
                      className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700"
                    />
                  </div>

                  {image.imageSrc && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-700">Crop</p>
                      <label className="block text-xs text-slate-600">
                        Horizontal: {image.cropX}%
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={image.cropX}
                          onChange={(e) =>
                            onUpdateImage(image.id, { cropX: Number(e.target.value) })
                          }
                          className="mt-1 w-full accent-indigo-600"
                        />
                      </label>
                      <label className="block text-xs text-slate-600">
                        Vertical: {image.cropY}%
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={image.cropY}
                          onChange={(e) =>
                            onUpdateImage(image.id, { cropY: Number(e.target.value) })
                          }
                          className="mt-1 w-full accent-indigo-600"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default PosterImagesAccordion;
