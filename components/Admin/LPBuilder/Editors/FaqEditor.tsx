import React, { useState } from 'react';
import { FaqItem } from '../../../../types';
import { Plus, Trash2, HelpCircle, Calendar, CreditCard, MapPin, FileText, Users, ChevronUp, ChevronDown } from 'lucide-react';

interface FaqEditorProps {
  faq: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}

const FaqEditor: React.FC<FaqEditorProps> = ({ faq, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addFaq = () => {
    const newItem: FaqItem = { id: Date.now().toString(), question: 'New Question?', answer: '', icon: 'help' };
    onChange([...faq, newItem]);
    setExpandedId(newItem.id);
  };

  const removeFaq = (id: string) => {
    onChange(faq.filter(f => f.id !== id));
  };

  const updateFaq = (id: string, field: keyof FaqItem, value: any) => {
    onChange(faq.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{faq.length} Questions</span>
        <button onClick={addFaq} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> Add Question
        </button>
      </div>

      <div className="space-y-3">
        {faq.map((item) => (
          <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div 
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-500">
                  <HelpCircle size={16} />
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{item.question || 'New Question'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); removeFaq(item.id); }} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
                {expandedId === item.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {expandedId === item.id && (
              <div className="p-4 border-t border-slate-100 space-y-3">
                <input 
                  type="text" 
                  value={item.question}
                  onChange={(e) => updateFaq(item.id, 'question', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                />
                <textarea 
                  rows={3}
                  value={item.answer}
                  onChange={(e) => updateFaq(item.id, 'answer', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm resize-none bg-white text-slate-900"
                />
                <div className="flex gap-2">
                   {['help', 'calendar', 'credit-card', 'map-pin', 'file-text', 'users'].map((iconName) => (
                     <button
                       key={iconName}
                       onClick={() => updateFaq(item.id, 'icon', iconName as any)}
                       className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                         item.icon === iconName ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-400'
                       }`}
                     >
                       {/* Simplified icon selector - normally we'd show the actual icon */}
                       <div className="text-[10px] font-bold uppercase">{iconName[0]}</div>
                     </button>
                   ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqEditor;
