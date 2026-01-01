import React from 'react';
import { PartnerGroup } from '../../types';
import { ArrowRight } from 'lucide-react';

interface PartnersSectionProps {
  groups: PartnerGroup[];
  title?: string;
}

const PartnersSection: React.FC<PartnersSectionProps> = ({ groups, title = "Our Partners & Sponsors" }) => {
  return (
    <div className="py-24 px-8 bg-white border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">{title}</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Supported by world-leading organizations committed to the advancement of science and technology.
          </p>
        </div>

        <div className="space-y-20">
          {groups.map((group) => (
            <div key={group.id} className="relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-100 pb-4">
                <h3 className="text-2xl font-bold text-slate-800">{group.name}</h3>
                
                {group.showActionButton && group.actionButtonUrl && (
                  <a 
                    href={group.actionButtonUrl}
                    className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors group"
                  >
                    {group.actionButtonText || 'Learn More'}
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </a>
                )}
              </div>

              {group.displayStyle === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center">
                  {group.partners.map((partner) => (
                    <a 
                      key={partner.id}
                      href={partner.link || '#'}
                      target={partner.link ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center gap-4 transition-all hover:scale-105"
                    >
                      <div className="w-full aspect-[3/2] flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-indigo-100 group-hover:bg-white transition-all shadow-sm hover:shadow-md">
                        <img 
                          src={partner.logoUrl} 
                          alt={partner.name} 
                          className="max-w-full max-h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" 
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        {partner.name}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="relative group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
                  
                  <div className={`flex gap-12 py-4 ${group.displayStyle === 'marquee-left' ? 'animate-marquee' : 'animate-marquee-reverse'}`}>
                    {/* Double the array for seamless infinite scrolling */}
                    {[...group.partners, ...group.partners, ...group.partners].map((partner, idx) => (
                      <a 
                        key={`${partner.id}-${idx}`}
                        href={partner.link || '#'}
                        className="flex-shrink-0 flex items-center justify-center h-20 w-48 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                      >
                        <img 
                          src={partner.logoUrl} 
                          alt={partner.name} 
                          className="max-w-full max-h-full object-contain" 
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee-reverse {
          display: flex;
          width: fit-content;
          animation: marquee-reverse 30s linear infinite;
        }
        .animate-marquee:hover, .animate-marquee-reverse:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default PartnersSection;