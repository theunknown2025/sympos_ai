import React, { useState } from 'react';
import { ImageGroup } from '../../../../types';
import { Image, ChevronLeft, ChevronRight } from 'lucide-react';
import { isArabic } from '../../../../utils/languageDetection';

interface ImagesSectionProps {
  groups: ImageGroup[];
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

const ImagesSection: React.FC<ImagesSectionProps> = ({ 
  groups, 
  title = "Gallery", 
  titleAlignment = 'center' 
}) => {
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);

  return (
    <div className="py-24 px-8 bg-white border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
          <h2 className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {isTitleArabic ? (
              <>
                <span>{title}</span>
                <Image size={32} className="text-indigo-600" />
              </>
            ) : (
              <>
                <Image size={32} className="text-indigo-600" />
                <span>{title}</span>
              </>
            )}
          </h2>
        </div>

        <div className="space-y-20">
          {groups.map((group) => (
            <ImageGroupDisplay key={group.id} group={group} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ImageGroupDisplayProps {
  group: ImageGroup;
}

const ImageGroupDisplay: React.FC<ImageGroupDisplayProps> = ({ group }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!group.images || group.images.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Image size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-sm">No images in this group</p>
      </div>
    );
  }

  // Ensure format exists and is valid
  if (!group.format) {
    // Default to catalogue1 if format is missing
    const defaultGroup = { ...group, format: 'catalogue1' as const, showNavigation: group.showNavigation ?? true };
    return <CatalogueDisplay group={defaultGroup} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />;
  }

  // Catalogue formats
  if (group.format.startsWith('catalogue')) {
    return <CatalogueDisplay group={group} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />;
  }

  // Slider formats
  if (group.format === 'slider-rtl' || group.format === 'slider-ltr') {
    return <SliderDisplay group={group} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />;
  }

  // Fallback: show images in a simple grid if format is unknown
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {group.images.map((image) => (
        <div key={image.id} className="rounded-lg overflow-hidden">
          <img src={image.url} alt={image.alt || ''} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
};

interface CatalogueDisplayProps {
  group: ImageGroup;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const CatalogueDisplay: React.FC<CatalogueDisplayProps> = ({ group, currentIndex, setCurrentIndex }) => {
  const maxVisible = 5; // Maximum 5 images visible (1 main + 4 small)
  const mainImage = group.images[currentIndex];
  const smallImages = group.images.filter((_, idx) => idx !== currentIndex).slice(0, 4);
  const hasMore = group.images.length > maxVisible;

  // Main image fixed dimensions (fallback defaults)
  const mainWidth = group.mainWidth ?? 480;
  const mainHeight = group.mainHeight ?? 360;

  const getCatalogueLayout = () => {
    switch (group.format) {
      case 'catalogue1':
        // Thumbnails on the left, main image on the right
        return (
          <div className="relative max-w-5xl mx-auto flex items-start gap-6">
            {/* Thumbnails column (left) */}
            <div className="flex flex-col gap-3 w-28">
              {smallImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    const idx = group.images.findIndex(i => i.id === img.id);
                    setCurrentIndex(idx);
                  }}
                  className="w-full aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all hover:scale-105"
                >
                  <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main image (right) */}
            <div className="relative rounded-xl overflow-hidden border-4 border-indigo-500 shadow-2xl bg-slate-50"
                 style={{ width: mainWidth, height: mainHeight }}>
              <img
                src={mainImage.url}
                alt={mainImage.alt || ''}
                className="w-full h-full object-cover"
              />
              {group.showNavigation && group.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentIndex((currentIndex - 1 + group.images.length) % group.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={22} className="text-indigo-600" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex((currentIndex + 1) % group.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
                    aria-label="Next image"
                  >
                    <ChevronRight size={22} className="text-indigo-600" />
                  </button>
                </>
              )}
            </div>
          </div>
        );

      case 'catalogue2':
        // Thumbnails on the right, main image on the left
        return (
          <div className="relative max-w-5xl mx-auto flex items-start gap-6">
            {/* Main image (left) */}
            <div className="relative rounded-xl overflow-hidden border-4 border-indigo-500 shadow-2xl bg-slate-50"
                 style={{ width: mainWidth, height: mainHeight }}>
              <img
                src={mainImage.url}
                alt={mainImage.alt || ''}
                className="w-full h-full object-cover"
              />
              {group.showNavigation && group.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentIndex((currentIndex - 1 + group.images.length) % group.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={22} className="text-indigo-600" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex((currentIndex + 1) % group.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
                    aria-label="Next image"
                  >
                    <ChevronRight size={22} className="text-indigo-600" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails column (right) */}
            <div className="flex flex-col gap-3 w-28">
              {smallImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    const idx = group.images.findIndex(i => i.id === img.id);
                    setCurrentIndex(idx);
                  }}
                  className="w-full aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all hover:scale-105"
                >
                  <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        );

      case 'catalogue3':
        // Main center, small images arranged differently
        return (
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-5 gap-2">
              {/* Left small images */}
              <div className="space-y-2">
                {smallImages.slice(0, 2).map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      const imageIdx = group.images.findIndex(i => i.id === img.id);
                      setCurrentIndex(imageIdx);
                    }}
                    className="w-full aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all hover:scale-105"
                  >
                    <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Main center image */}
              <div className="col-span-3 relative">
                <div className="aspect-square rounded-xl overflow-hidden border-4 border-indigo-500 shadow-2xl">
                  <img src={mainImage.url} alt={mainImage.alt || ''} className="w-full h-full object-cover" />
                </div>
                {group.showNavigation && group.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentIndex((currentIndex - 1 + group.images.length) % group.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} className="text-indigo-600" />
                    </button>
                    <button
                      onClick={() => setCurrentIndex((currentIndex + 1) % group.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} className="text-indigo-600" />
                    </button>
                  </>
                )}
              </div>

              {/* Right small images */}
              <div className="space-y-2">
                {smallImages.slice(2, 4).map((img) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      const imageIdx = group.images.findIndex(i => i.id === img.id);
                      setCurrentIndex(imageIdx);
                    }}
                    className="w-full aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all hover:scale-105"
                  >
                    <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation dots */}
            {hasMore && (
              <div className="flex justify-center gap-2 mt-6">
                {group.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-indigo-600 w-8' : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'catalogue4':
        // Main center, small images in a cross pattern
        return (
          <div className="relative max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-3">
              {/* Top */}
              <div className="col-span-3 flex justify-center mb-2">
                {smallImages[3] && (
                  <button
                    onClick={() => {
                      const idx = group.images.findIndex(img => img.id === smallImages[3].id);
                      setCurrentIndex(idx);
                    }}
                    className="w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all hover:scale-105"
                  >
                    <img src={smallImages[3].url} alt={smallImages[3].alt || ''} className="w-full h-full object-cover" />
                  </button>
                )}
              </div>

              {/* Middle row */}
              <div className="col-span-3 flex items-center justify-center gap-3">
                {/* Left */}
                {smallImages[0] && (
                  <button
                    onClick={() => {
                      const idx = group.images.findIndex(img => img.id === smallImages[0].id);
                      setCurrentIndex(idx);
                    }}
                    className="w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all hover:scale-105"
                  >
                    <img src={smallImages[0].url} alt={smallImages[0].alt || ''} className="w-full h-full object-cover" />
                  </button>
                )}

                {/* Main center */}
                <div className="relative">
                  <div className="w-64 h-64 rounded-xl overflow-hidden border-4 border-indigo-500 shadow-2xl">
                    <img src={mainImage.url} alt={mainImage.alt || ''} className="w-full h-full object-cover" />
                  </div>
                  {group.showNavigation && group.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentIndex((currentIndex - 1 + group.images.length) % group.images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={20} className="text-indigo-600" />
                      </button>
                      <button
                        onClick={() => setCurrentIndex((currentIndex + 1) % group.images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                        aria-label="Next image"
                      >
                        <ChevronRight size={20} className="text-indigo-600" />
                      </button>
                    </>
                  )}
                </div>

                {/* Right */}
                {smallImages[1] && (
                  <button
                    onClick={() => {
                      const idx = group.images.findIndex(img => img.id === smallImages[1].id);
                      setCurrentIndex(idx);
                    }}
                    className="w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all hover:scale-105"
                  >
                    <img src={smallImages[1].url} alt={smallImages[1].alt || ''} className="w-full h-full object-cover" />
                  </button>
                )}
              </div>

              {/* Bottom */}
              <div className="col-span-3 flex justify-center mt-2">
                {smallImages[2] && (
                  <button
                    onClick={() => {
                      const idx = group.images.findIndex(img => img.id === smallImages[2].id);
                      setCurrentIndex(idx);
                    }}
                    className="w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-indigo-500 transition-all hover:scale-105"
                  >
                    <img src={smallImages[2].url} alt={smallImages[2].alt || ''} className="w-full h-full object-cover" />
                  </button>
                )}
              </div>
            </div>

            {/* Navigation dots */}
            {hasMore && (
              <div className="flex justify-center gap-2 mt-6">
                {group.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-indigo-600 w-8' : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return getCatalogueLayout();
};

interface SliderDisplayProps {
  group: ImageGroup;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const SliderDisplay: React.FC<SliderDisplayProps> = ({ group, currentIndex, setCurrentIndex }) => {
  const isRTL = group.format === 'slider-rtl';

  const nextImage = () => {
    setCurrentIndex((currentIndex + 1) % group.images.length);
  };

  const prevImage = () => {
    setCurrentIndex((currentIndex - 1 + group.images.length) % group.images.length);
  };

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-xl">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            direction: isRTL ? 'rtl' : 'ltr'
          }}
        >
          {group.images.map((image) => (
            <div key={image.id} className="min-w-full flex-shrink-0">
              <div className="aspect-video w-full">
                <img 
                  src={image.url} 
                  alt={image.alt || ''} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>

        {group.showNavigation && group.images.length > 1 && (
          <>
            <button
              onClick={isRTL ? nextImage : prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} className="text-indigo-600" />
            </button>
            <button
              onClick={isRTL ? prevImage : nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110 z-10"
              aria-label="Next image"
            >
              <ChevronRight size={24} className="text-indigo-600" />
            </button>
          </>
        )}
      </div>

      {/* Navigation dots */}
      {group.images.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {group.images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-indigo-600 w-8' : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagesSection;

