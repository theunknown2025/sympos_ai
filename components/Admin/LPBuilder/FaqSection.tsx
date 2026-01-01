import React, { useState } from 'react';
import { FaqItem } from '../../../types';
import { 
  HelpCircle, Calendar, CreditCard, MapPin, FileText, Users, ChevronDown, ChevronUp 
} from 'lucide-react';
import { isArabic } from '../../../utils/languageDetection';

interface FaqSectionProps {
  items: FaqItem[];
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

const IconMap = {
  'help': HelpCircle,
  'calendar': Calendar,
  'credit-card': CreditCard,
  'map-pin': MapPin,
  'file-text': FileText,
  'users': Users
};

const FaqSection: React.FC<FaqSectionProps> = ({ items, title = "Frequently Asked Questions", titleAlignment = 'center' }) => {
  const [openId, setOpenId] = useState<string | null>(items.length > 0 ? items[0].id : null);
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (items.length === 0) {
    return (
      <div className={`py-20 px-8 max-w-4xl mx-auto border-t border-slate-100 ${titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center'}`}>
        <h2 className={`text-2xl font-bold text-slate-900 mb-2 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''} ${titleAlignment === 'left' ? 'justify-start' : titleAlignment === 'right' ? 'justify-end' : 'justify-center'}`}>
          {isTitleArabic ? (
            <>
              <span>{title}</span>
              <HelpCircle size={24} className="text-indigo-600" />
            </>
          ) : (
            <>
              <HelpCircle size={24} className="text-indigo-600" />
              <span>{title}</span>
            </>
          )}
        </h2>
        <p className="text-slate-500">No questions added yet.</p>
      </div>
    );
  }

  return (
    <div className="py-24 px-8 bg-slate-50 border-t border-slate-100">
      <div className="max-w-3xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
          <h2 className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {isTitleArabic ? (
              <>
                <span>{title}</span>
                <HelpCircle size={32} className="text-indigo-600" />
              </>
            ) : (
              <>
                <HelpCircle size={32} className="text-indigo-600" />
                <span>{title}</span>
              </>
            )}
          </h2>
          <p className="text-slate-500">Find answers to common questions about the conference.</p>
        </div>

        <div className="space-y-4">
          {items.map((item) => {
            const Icon = IconMap[item.icon] || HelpCircle;
            const isOpen = openId === item.id;

            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                  isOpen ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <span className={`font-semibold text-lg ${isOpen ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {item.question}
                    </span>
                  </div>
                  <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>
                
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-5 pb-6 pl-[4.5rem] pr-8">
                     <p className="text-slate-600 leading-relaxed">
                       {item.answer}
                     </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FaqSection;