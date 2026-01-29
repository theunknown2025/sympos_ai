import React from 'react';
import { PricingOffer } from '../../../../types';
import { Check, ArrowRight, Tag } from 'lucide-react';
import { isArabic } from '../../../../utils/languageDetection';

interface PricingSectionProps {
  offers: PricingOffer[];
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

const PricingSection: React.FC<PricingSectionProps> = ({ offers, title = "Tickets & Pricing", titleAlignment = 'center' }) => {
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);
  
  return (
    <div className="py-24 px-8 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
          <h2 className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {isTitleArabic ? (
              <>
                <span>{title}</span>
                <Tag size={32} className="text-indigo-600" />
              </>
            ) : (
              <>
                <Tag size={32} className="text-indigo-600" />
                <span>{title}</span>
              </>
            )}
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Choose the best plan for your conference experience. Special rates available for students and early registrants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {offers.map((offer) => (
            <div 
              key={offer.id} 
              className={`relative bg-white rounded-3xl p-8 border transition-all duration-300 flex flex-col ${
                offer.isHighlighted 
                  ? 'border-indigo-600 shadow-xl shadow-indigo-100 ring-2 ring-indigo-600/10 scale-105 z-10' 
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {offer.isHighlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Recommended
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">{offer.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{offer.currency}{offer.price}</span>
                  <span className="text-slate-500 font-medium">/ person</span>
                </div>
              </div>

              <div className="flex-grow space-y-4 mb-10">
                {offer.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} className="text-emerald-600" />
                    </div>
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <a 
                  href={offer.isSoldOut ? '#' : offer.buttonUrl}
                  onClick={(e) => offer.isSoldOut && e.preventDefault()}
                  className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    offer.isSoldOut
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : offer.isHighlighted
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                        : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {offer.isSoldOut ? 'Sold Out' : offer.buttonText}
                  {!offer.isSoldOut && <ArrowRight size={18} />}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
