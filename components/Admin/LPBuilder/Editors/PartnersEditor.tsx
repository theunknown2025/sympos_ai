import React, { useState } from 'react';
import { PartnerGroup, Partner } from '../../../../types';
import { Plus, Trash2, Users, ChevronUp, ChevronDown, ImageIcon } from 'lucide-react';

interface PartnersEditorProps {
  partners: PartnerGroup[];
  onChange: (groups: PartnerGroup[]) => void;
}

const PartnersEditor: React.FC<PartnersEditorProps> = ({ partners, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addGroup = () => {
    const newGroup: PartnerGroup = { id: Date.now().toString(), name: 'New Group', displayStyle: 'grid', partners: [] };
    onChange([...partners, newGroup]);
    setExpandedId(newGroup.id);
  };

  const removeGroup = (id: string) => {
    onChange(partners.filter(g => g.id !== id));
  };

  const updateGroup = (id: string, field: keyof PartnerGroup, value: any) => {
    onChange(partners.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const addLogo = (groupId: string) => {
    const group = partners.find(g => g.id === groupId);
    if (group) {
      const newPartner: Partner = { id: Date.now().toString(), name: 'Logo', logoUrl: '' };
      updateGroup(groupId, 'partners', [...group.partners, newPartner]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-slate-500">{partners.length} Groups</span>
        <button onClick={addGroup} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> Add Group
        </button>
      </div>

      <div className="space-y-4">
        {partners.map((group) => (
          <div key={group.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div 
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
            >
              <div className="flex items-center gap-3">
                 <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                   <Users size={14} />
                 </div>
                 <h5 className="text-sm font-semibold text-slate-800">{group.name}</h5>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
                {expandedId === group.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </div>

            {expandedId === group.id && (
              <div className="p-4 border-t border-slate-100 space-y-4">
                <input type="text" value={group.name} onChange={(e) => updateGroup(group.id, 'name', e.target.value)} placeholder="Group Name" className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white" />
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Logos ({group.partners.length})</label>
                   <button onClick={() => addLogo(group.id)} className="text-[10px] text-indigo-600 font-medium">+ Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnersEditor;
