import React, { useState, useEffect } from 'react';
import { X, Layout } from 'lucide-react';
import { getPresenterSpeaker } from '../../../../services/presenterService';
import { PresenterSpeaker, PresenterEvent } from '../../../../types';
import { speakerTemplates, SpeakerTemplate } from './Templates/Speakers';

interface DisplaySpeakerProps {
  speakerId: string;
  event: PresenterEvent;
  onClose: () => void;
  templateId?: string;
}

const DisplaySpeaker: React.FC<DisplaySpeakerProps> = ({ speakerId, event, onClose, templateId }) => {
  const [speaker, setSpeaker] = useState<PresenterSpeaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<SpeakerTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  useEffect(() => {
    loadSpeaker();
  }, [speakerId]);

  useEffect(() => {
    // Set default template or use provided templateId
    const template = templateId 
      ? speakerTemplates.find(t => t.id === templateId)
      : speakerTemplates[0]; // Default to first template
    
    setSelectedTemplate(template || speakerTemplates[0]);
  }, [templateId]);

  const loadSpeaker = async () => {
    try {
      setLoading(true);
      const speakerData = await getPresenterSpeaker(speakerId);
      setSpeaker(speakerData);
    } catch (err) {
      console.error('Failed to load speaker:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !speaker || !selectedTemplate) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const TemplateComponent = selectedTemplate.component;

  return (
    <div className="fixed inset-0 z-50">
      {/* Template Selector Button */}
      <button
        onClick={() => setShowTemplateSelector(!showTemplateSelector)}
        className="absolute top-6 left-6 z-50 p-3 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors flex items-center gap-2"
      >
        <Layout size={20} className="text-slate-700" />
        <span className="text-sm font-medium text-slate-700">Template</span>
      </button>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
      >
        <X size={24} className="text-slate-700" />
      </button>

      {/* Template Selector Dropdown */}
      {showTemplateSelector && (
        <div className="absolute top-20 left-6 z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-4 min-w-[280px]">
          <div className="text-sm font-semibold text-slate-700 mb-3">Select Template</div>
          <div className="space-y-2">
            {speakerTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowTemplateSelector(false);
                }}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  selectedTemplate.id === template.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-medium text-slate-900">{template.name}</div>
                <div className="text-xs text-slate-500 mt-1">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render Selected Template */}
      <TemplateComponent speaker={speaker} event={event} />
    </div>
  );
};

export default DisplaySpeaker;
