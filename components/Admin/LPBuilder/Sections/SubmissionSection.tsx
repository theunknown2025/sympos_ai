import React, { useRef } from 'react';
import { SubmissionSectionConfig } from '../../../../types';
import { FileText, ArrowRight, Download, Calendar, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { isArabic } from '../../../../utils/languageDetection';

interface SubmissionSectionProps {
  config: SubmissionSectionConfig;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

const SubmissionSection: React.FC<SubmissionSectionProps> = ({ config, title = "Call for Papers", titleAlignment = 'center' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth 
        : scrollLeft + clientWidth;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="py-24 px-8 bg-slate-50 border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
           <h2 className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {isTitleArabic ? (
              <>
                <span>{title}</span>
                <FileText size={32} className="text-indigo-600" />
              </>
            ) : (
              <>
                <FileText size={32} className="text-indigo-600" />
                <span>{title}</span>
              </>
            )}
          </h2>
           <p className="text-slate-500 max-w-2xl mx-auto text-lg">
             Key milestones and deadlines for research submissions. Ensure your work is submitted within the designated timeframe.
           </p>
        </div>

        {/* Steps Carousel Wrapper */}
        <div className="relative mb-16 group/carousel">
          {/* Navigation Buttons */}
          {config.steps.length > 1 && (
            <>
              <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:translate-x-0"
                aria-label="Previous steps"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:translate-x-0"
                aria-label="Next steps"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Scrolling Container */}
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {config.steps.map((step, index) => (
              <div 
                key={step.id} 
                className="flex-none w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] snap-start"
              >
                <div className="group bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                  {/* Sequence Number Background */}
                  <div className="absolute -right-4 -top-4 text-slate-50 font-bold text-8xl pointer-events-none transition-colors group-hover:text-indigo-50/50">
                    {index + 1}
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6 w-fit">
                      <Calendar size={14} />
                      {step.date}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">
                      {step.title}
                    </h3>
                    
                    <div className="w-10 h-1 bg-indigo-600 rounded-full mb-6 transition-all group-hover:w-20"></div>

                    <p className="text-slate-600 leading-relaxed text-sm flex-grow">
                      {step.description}
                    </p>

                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Info size={14} className="text-indigo-400" />
                        Milestone {index + 1}
                      </div>
                      {index === config.steps.length - 1 && (
                        <span className="text-emerald-500 font-bold">Start</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-6">
           {config.buttons.map(btn => (
             <button 
                key={btn.id}
                className={`px-10 py-4 rounded-xl font-bold transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 shadow-lg ${
                  btn.style === 'primary' 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 shadow-slate-200'
                }`}
             >
                {btn.text}
                {btn.text.toLowerCase().includes('download') ? <Download size={18} /> : <ArrowRight size={18} />}
             </button>
           ))}
           {config.buttons.length === 0 && (
             <div className="text-slate-400 italic bg-white px-8 py-3 rounded-full border border-dashed border-slate-200">
               No call actions currently active
             </div>
           )}
        </div>

      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default SubmissionSection;
