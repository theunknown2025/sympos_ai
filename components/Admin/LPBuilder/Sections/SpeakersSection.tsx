import React from 'react';
import { Speaker } from '../../../../types';
import { User, Linkedin, Twitter, Globe, Users } from 'lucide-react';
import { isArabic } from '../../../../utils/languageDetection';

interface SpeakersSectionProps {
  speakers: Speaker[];
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

const SpeakersSection: React.FC<SpeakersSectionProps> = ({ speakers, title = "Keynote Speakers", titleAlignment = 'center' }) => {
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);
  
  return (
    <div className="py-24 px-8 bg-slate-50 border-t border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
          <h2 className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {isTitleArabic ? (
              <>
                <span>{title}</span>
                <Users size={32} className="text-indigo-600" />
              </>
            ) : (
              <>
                <Users size={32} className="text-indigo-600" />
                <span>{title}</span>
              </>
            )}
          </h2>
          <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full mb-6"></div>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Meet the visionaries and world-class experts who will be sharing their insights at the forefront of innovation.
          </p>
        </div>
        
        {speakers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {speakers.map(speaker => (
              <div key={speaker.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                 <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 border-4 border-slate-50 shadow-inner group-hover:border-indigo-100 transition-all">
                   {speaker.imageUrl ? (
                     <img src={speaker.imageUrl} alt={speaker.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                       <User size={48} />
                     </div>
                   )}
                 </div>
                 <div className="text-center">
                   <h3 className="text-xl font-bold text-slate-900 mb-1">{speaker.name}</h3>
                   <p className="text-indigo-600 font-semibold text-sm mb-4 uppercase tracking-wider">{speaker.role}</p>
                   <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3 group-hover:line-clamp-none transition-all">
                     {speaker.bio}
                   </p>
                   
                   <div className="flex justify-center gap-4 pt-6 border-t border-slate-50">
                     {speaker.socials.length > 0 ? (
                       speaker.socials.map(social => (
                         <a 
                           key={social.id} 
                           href={social.url} 
                           className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                           target="_blank" rel="noopener noreferrer"
                         >
                            {social.platform === 'linkedin' && <Linkedin size={18} />}
                            {social.platform === 'twitter' && <Twitter size={18} />}
                            {social.platform === 'website' && <Globe size={18} />}
                         </a>
                       ))
                     ) : (
                       <span className="text-xs text-slate-300 italic">No social links provided</span>
                     )}
                   </div>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-white shadow-inner">
             <User size={48} className="mb-4 opacity-20"/>
             <p className="font-medium">No speakers added yet.</p>
             <p className="text-sm">Use the Speakers Editor to populate this list.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakersSection;
