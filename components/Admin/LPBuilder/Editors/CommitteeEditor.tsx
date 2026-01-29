import React, { useState } from 'react';
import { CommitteeMember } from '../../../../types';
import { Plus, Trash2, ImageIcon, User, ChevronUp, ChevronDown } from 'lucide-react';

interface CommitteeEditorProps {
  committee: CommitteeMember[];
  onChange: (members: CommitteeMember[]) => void;
}

const CommitteeEditor: React.FC<CommitteeEditorProps> = ({ committee, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addMember = () => {
    const newMember: CommitteeMember = { id: Date.now().toString(), name: 'New Member', role: 'Role', affiliation: 'Affiliation', bio: '', imageUrl: '', socials: [] };
    onChange([...committee, newMember]);
    setExpandedId(newMember.id);
  };

  const removeMember = (id: string) => {
    onChange(committee.filter(c => c.id !== id));
  };

  const updateMember = (id: string, field: keyof CommitteeMember, value: any) => {
    onChange(committee.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{committee.length} Members</span>
        <button onClick={addMember} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> Add Member
        </button>
      </div>
      
      <div className="space-y-3">
        {committee.map((member) => (
          <div key={member.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div 
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === member.id ? null : member.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                    {member.imageUrl ? <img src={member.imageUrl} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-emerald-500" />}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">{member.name || 'New Member'}</p>
                    <p className="text-xs text-slate-500 truncate">{member.role || 'No title'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); removeMember(member.id); }} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
                {expandedId === member.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {expandedId === member.id && (
              <div className="p-4 border-t border-slate-100 space-y-3">
                <input 
                  type="text" 
                  value={member.name}
                  onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    value={member.role}
                    onChange={(e) => updateMember(member.id, 'role', e.target.value)}
                    placeholder="Role (e.g. Chair)"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                  <input 
                    type="text" 
                    value={member.affiliation}
                    onChange={(e) => updateMember(member.id, 'affiliation', e.target.value)}
                    placeholder="Affiliation"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                </div>
                <div className="relative">
                  <ImageIcon size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={member.imageUrl}
                    onChange={(e) => updateMember(member.id, 'imageUrl', e.target.value)}
                    placeholder="Photo URL"
                    className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitteeEditor;
