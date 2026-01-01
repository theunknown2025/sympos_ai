import React from 'react';
import { CommitteeMember } from '../../../types';
import { User, Linkedin, Twitter, Globe, Award } from 'lucide-react';
import { isArabic } from '../../../utils/languageDetection';

interface ScientificCommitteeSectionProps {
  members: CommitteeMember[];
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

const ScientificCommitteeSection: React.FC<ScientificCommitteeSectionProps> = ({ members, title = "Scientific Committee", titleAlignment = 'center' }) => {
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);
  
  return (
    <div className="py-24 px-8 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
          <h2 className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {isTitleArabic ? (
              <>
                <span>{title}</span>
                <Award size={32} className="text-indigo-600" />
              </>
            ) : (
              <>
                <Award size={32} className="text-indigo-600" />
                <span>{title}</span>
              </>
            )}
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Our distinguished committee members ensuring the highest scientific standards.
          </p>
        </div>

        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-slate-100 group-hover:border-indigo-100 transition-colors">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <User size={32} />
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{member.name}</h3>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">{member.role}</span>
                <p className="text-sm text-slate-500 font-medium mb-3">{member.affiliation}</p>
                
                {/* Socials - Compact */}
                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50 w-full justify-center opacity-70 hover:opacity-100 transition-opacity">
                   {member.socials.map(social => (
                      <a 
                        key={social.id} 
                        href={social.url} 
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        target="_blank" rel="noopener noreferrer"
                      >
                         {social.platform === 'linkedin' && <Linkedin size={16} />}
                         {social.platform === 'twitter' && <Twitter size={16} />}
                         {social.platform === 'website' && <Globe size={16} />}
                      </a>
                   ))}
                   {member.socials.length === 0 && <span className="text-[10px] text-slate-300 italic">No links</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-48 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
             <Award size={48} className="mb-4 opacity-50"/>
             <p>No committee members added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScientificCommitteeSection;