import React, { useState } from 'react';
import { TeamMember, SocialLink } from '../../../../types';
import { Plus, Trash2, ImageIcon, User, ChevronUp, ChevronDown, Linkedin, Twitter, Globe, Facebook, Instagram, Github, Youtube, Phone, Mail } from 'lucide-react';

interface TeamEditorProps {
  members: TeamMember[];
  onChange: (members: TeamMember[]) => void;
}

const TeamEditor: React.FC<TeamEditorProps> = ({ members, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addMember = () => {
    const newMember: TeamMember = { 
      id: Date.now().toString(), 
      name: 'New Team Member', 
      phone: '',
      email: '',
      function: 'Role', 
      bio: '', 
      imageUrl: '', 
      links: [] 
    };
    onChange([...members, newMember]);
    setExpandedId(newMember.id);
  };

  const removeMember = (id: string) => {
    onChange(members.filter(m => m.id !== id));
  };

  const updateMember = (id: string, field: keyof TeamMember, value: any) => {
    onChange(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addLink = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const newLink: SocialLink = { id: Date.now().toString(), platform: 'linkedin', url: '#' };
      updateMember(memberId, 'links', [...member.links, newLink]);
    }
  };

  const removeLink = (memberId: string, linkId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      updateMember(memberId, 'links', member.links.filter(l => l.id !== linkId));
    }
  };

  const updateLink = (memberId: string, linkId: string, field: keyof SocialLink, value: any) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const updatedLinks = member.links.map(l => 
        l.id === linkId ? { ...l, [field]: value } : l
      );
      updateMember(memberId, 'links', updatedLinks);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin size={14} />;
      case 'twitter': return <Twitter size={14} />;
      case 'facebook': return <Facebook size={14} />;
      case 'instagram': return <Instagram size={14} />;
      case 'github': return <Github size={14} />;
      case 'youtube': return <Youtube size={14} />;
      case 'website': return <Globe size={14} />;
      default: return <Globe size={14} />;
    }
  };

  const platformOptions: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={14} /> },
    { value: 'twitter', label: 'Twitter', icon: <Twitter size={14} /> },
    { value: 'facebook', label: 'Facebook', icon: <Facebook size={14} /> },
    { value: 'instagram', label: 'Instagram', icon: <Instagram size={14} /> },
    { value: 'github', label: 'GitHub', icon: <Github size={14} /> },
    { value: 'youtube', label: 'YouTube', icon: <Youtube size={14} /> },
    { value: 'website', label: 'Website', icon: <Globe size={14} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{members.length} Team Members</span>
        <button onClick={addMember} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> Add Member
        </button>
      </div>
      
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div 
              className="p-3 bg-white flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === member.id ? null : member.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                    {member.imageUrl ? <img src={member.imageUrl} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-indigo-400" />}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">{member.name || 'New Team Member'}</p>
                    <p className="text-xs text-slate-500 truncate">{member.function || 'No function'}</p>
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
                <input 
                  type="text" 
                  value={member.function}
                  onChange={(e) => updateMember(member.id, 'function', e.target.value)}
                  placeholder="Function / Role"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                />
                <div className="relative">
                  <Phone size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  <input 
                    type="tel" 
                    value={member.phone}
                    onChange={(e) => updateMember(member.id, 'phone', e.target.value)}
                    placeholder="Phone Number"
                    className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                </div>
                <div className="relative">
                  <Mail size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  <input 
                    type="email" 
                    value={member.email}
                    onChange={(e) => updateMember(member.id, 'email', e.target.value)}
                    placeholder="Email Address"
                    className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
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
                <textarea 
                  rows={3}
                  value={member.bio}
                  onChange={(e) => updateMember(member.id, 'bio', e.target.value)}
                  placeholder="Short bio..."
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm resize-none bg-white text-slate-900"
                />
                
                {/* Social Links */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-700">Social Links</span>
                    <button onClick={() => addLink(member.id)} className="text-[10px] text-indigo-600 font-medium hover:underline">
                      + Add Link
                    </button>
                  </div>
                  {member.links.map(link => (
                    <div key={link.id} className="flex gap-2 items-center p-2 bg-slate-50 rounded border border-slate-200">
                      <select
                        value={link.platform}
                        onChange={(e) => updateLink(member.id, link.id, 'platform', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900"
                      >
                        {platformOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(member.id, link.id, 'url', e.target.value)}
                        placeholder="URL"
                        className="flex-2 px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900"
                      />
                      <button
                        onClick={() => removeLink(member.id, link.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
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

export default TeamEditor;

