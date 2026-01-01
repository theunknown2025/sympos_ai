import React, { useState } from 'react';
import { SubmissionSectionConfig, TimelineStep, HeroButton } from '../../../types';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface SubmissionEditorProps {
  config: SubmissionSectionConfig;
  onChange: (config: SubmissionSectionConfig) => void;
}

const SubmissionEditor: React.FC<SubmissionEditorProps> = ({ config, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addStep = () => {
    const newStep: TimelineStep = { id: Date.now().toString(), date: 'Date', title: 'New Milestone', description: '' };
    onChange({ ...config, steps: [...config.steps, newStep] });
    setExpandedId(newStep.id);
  };

  const removeStep = (id: string) => {
    onChange({ ...config, steps: config.steps.filter(s => s.id !== id) });
  };

  const updateStep = (id: string, field: keyof TimelineStep, value: string) => {
    onChange({ ...config, steps: config.steps.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const addButton = () => {
    const newBtn: HeroButton = { id: Date.now().toString(), text: 'Action', url: '#', style: 'secondary' };
    onChange({ ...config, buttons: [...config.buttons, newBtn] });
  };

  const removeButton = (id: string) => {
    onChange({ ...config, buttons: config.buttons.filter(b => b.id !== id) });
  };

  const updateButton = (id: string, field: keyof HeroButton, value: string) => {
    onChange({ ...config, buttons: config.buttons.map(b => b.id === id ? { ...b, [field]: value } : b) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-slate-500">{config.steps.length} Steps</span>
        <button onClick={addStep} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> Add Step
        </button>
      </div>

      <div className="space-y-3">
        {config.steps.map((step) => (
          <div key={step.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div 
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
            >
              <p className="text-sm font-semibold text-slate-800 truncate">{step.title || 'New Step'}</p>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); removeStep(step.id); }} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
                {expandedId === step.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>
            {expandedId === step.id && (
              <div className="p-4 border-t border-slate-100 space-y-3">
                <input type="text" value={step.title} onChange={(e) => updateStep(step.id, 'title', e.target.value)} placeholder="Title" className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
                <input type="text" value={step.date} onChange={(e) => updateStep(step.id, 'date', e.target.value)} placeholder="Date (e.g. Jan 15)" className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-xs font-medium text-slate-700">Action Buttons</label>
          <button onClick={addButton} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
            <Plus size={12} /> Add Button
          </button>
        </div>
        <div className="space-y-3">
          {config.buttons.map((btn) => (
            <div key={btn.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
               <input type="text" value={btn.text} onChange={(e) => updateButton(btn.id, 'text', e.target.value)} placeholder="Label" className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
               <button onClick={() => removeButton(btn.id)} className="text-[10px] text-red-500">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubmissionEditor;