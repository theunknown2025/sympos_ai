import React, { useState } from 'react';
import { Speaker, SocialLink } from '../../../../types';
import { Plus, Trash2, ImageIcon, User, ChevronUp, ChevronDown, Linkedin, Twitter, Globe } from 'lucide-react';

interface SpeakersEditorProps {
  speakers: Speaker[];
  onChange: (speakers: Speaker[]) => void;
}

const SpeakersEditor: React.FC<SpeakersEditorProps> = ({ speakers, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addSpeaker = () => {
    const newSpeaker: Speaker = { id: Date.now().toString(), name: 'New Speaker', role: 'Role', bio: '', imageUrl: '', socials: [] };
    onChange([...speakers, newSpeaker]);
    setExpandedId(newSpeaker.id);
  };

  const removeSpeaker = (id: string) => {
    onChange(speakers.filter(s => s.id !== id));
  };

  const updateSpeaker = (id: string, field: keyof Speaker, value: any) => {
    onChange(speakers.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSocial = (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId);
    if (speaker) {
      const newSocial: SocialLink = { id: Date.now().toString(), platform: 'linkedin', url: '#' };
      updateSpeaker(speakerId, 'socials', [...speaker.socials, newSocial]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{speakers.length} Speakers</span>
        <button onClick={addSpeaker} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> Add Speaker
        </button>
      </div>
      
      <div className="space-y-3">
        {speakers.map((speaker) => (
          <div key={speaker.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div 
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === speaker.id ? null : speaker.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                    {speaker.imageUrl ? <img src={speaker.imageUrl} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-indigo-400" />}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">{speaker.name || 'New Speaker'}</p>
                    <p className="text-xs text-slate-500 truncate">{speaker.role || 'No title'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); removeSpeaker(speaker.id); }} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
                {expandedId === speaker.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {expandedId === speaker.id && (
              <div className="p-4 border-t border-slate-100 space-y-3">
                <input 
                  type="text" 
                  value={speaker.name}
                  onChange={(e) => updateSpeaker(speaker.id, 'name', e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                />
                <input 
                  type="text" 
                  value={speaker.role}
                  onChange={(e) => updateSpeaker(speaker.id, 'role', e.target.value)}
                  placeholder="Title / Role"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                />
                <div className="relative">
                  <ImageIcon size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={speaker.imageUrl}
                    onChange={(e) => updateSpeaker(speaker.id, 'imageUrl', e.target.value)}
                    placeholder="Photo URL"
                    className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                </div>
                <textarea 
                  rows={3}
                  value={speaker.bio}
                  onChange={(e) => updateSpeaker(speaker.id, 'bio', e.target.value)}
                  placeholder="Biography..."
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm resize-none bg-white text-slate-900"
                />
                <div>
                  <button onClick={() => addSocial(speaker.id)} className="text-[10px] text-indigo-600 font-medium hover:underline">+ Link</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeakersEditor;
