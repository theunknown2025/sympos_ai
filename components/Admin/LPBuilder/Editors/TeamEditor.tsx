import React, { useState, useMemo } from 'react';
import { TeamMember, SocialLink } from '../../../../types';
import { Plus, Trash2, ImageIcon, User, ChevronUp, ChevronDown, Linkedin, Twitter, Globe, Facebook, Instagram, Github, Youtube, Phone, Mail } from 'lucide-react';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';

interface TeamEditorProps {
  members: TeamMember[];
  onChange: (members: TeamMember[]) => void;
}

const TeamEditor: React.FC<TeamEditorProps> = ({ members, onChange }) => {
  const { t } = useAdminTranslation('pageBuilder');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const platformOptions = useMemo(
    (): { value: string; label: string; icon: React.ReactNode }[] => [
      { value: 'linkedin', label: t('edPlatformLinkedin'), icon: <Linkedin size={14} /> },
      { value: 'twitter', label: t('edPlatformTwitter'), icon: <Twitter size={14} /> },
      { value: 'facebook', label: t('edPlatformFacebook'), icon: <Facebook size={14} /> },
      { value: 'instagram', label: t('edPlatformInstagram'), icon: <Instagram size={14} /> },
      { value: 'github', label: t('edPlatformGithub'), icon: <Github size={14} /> },
      { value: 'youtube', label: t('edPlatformYoutube'), icon: <Youtube size={14} /> },
      { value: 'website', label: t('edPlatformWebsite'), icon: <Globe size={14} /> },
    ],
    [t]
  );

  const addMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: t('edDefaultNewTeamMember'),
      phone: '',
      email: '',
      function: t('edDefaultRoleLabel'),
      bio: '',
      imageUrl: '',
      links: [],
    };
    onChange([...members, newMember]);
    setExpandedId(newMember.id);
  };

  const removeMember = (id: string) => {
    onChange(members.filter((m) => m.id !== id));
  };

  const updateMember = (id: string, field: keyof TeamMember, value: any) => {
    onChange(members.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const addLink = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      const newLink: SocialLink = { id: Date.now().toString(), platform: 'linkedin', url: '#' };
      updateMember(memberId, 'links', [...member.links, newLink]);
    }
  };

  const removeLink = (memberId: string, linkId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      updateMember(memberId, 'links', member.links.filter((l) => l.id !== linkId));
    }
  };

  const updateLink = (memberId: string, linkId: string, field: keyof SocialLink, value: any) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      const updatedLinks = member.links.map((l) => (l.id === linkId ? { ...l, [field]: value } : l));
      updateMember(memberId, 'links', updatedLinks);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500">{t('edTeamMembersSummary', { count: members.length })}</span>
        <button onClick={addMember} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
          <Plus size={12} /> {t('edAddMember')}
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
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-indigo-400" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-800 truncate">{member.name || t('edDefaultNewTeamMember')}</p>
                  <p className="text-xs text-slate-500 truncate">{member.function || t('edNoFunctionYet')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMember(member.id);
                  }}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
                {expandedId === member.id ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </div>
            </div>

            {expandedId === member.id && (
              <div className="p-4 border-t border-slate-100 space-y-3">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                  placeholder={t('edPlaceholderFullName')}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                />
                <input
                  type="text"
                  value={member.function}
                  onChange={(e) => updateMember(member.id, 'function', e.target.value)}
                  placeholder={t('edPlaceholderFunctionRole')}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                />
                <div className="relative">
                  <Phone size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={member.phone}
                    onChange={(e) => updateMember(member.id, 'phone', e.target.value)}
                    placeholder={t('edPlaceholderPhone')}
                    className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                </div>
                <div className="relative">
                  <Mail size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={member.email}
                    onChange={(e) => updateMember(member.id, 'email', e.target.value)}
                    placeholder={t('edPlaceholderEmail')}
                    className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                </div>
                <div className="relative">
                  <ImageIcon size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={member.imageUrl}
                    onChange={(e) => updateMember(member.id, 'imageUrl', e.target.value)}
                    placeholder={t('edPlaceholderPhotoUrl')}
                    className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                </div>
                <textarea
                  rows={3}
                  value={member.bio}
                  onChange={(e) => updateMember(member.id, 'bio', e.target.value)}
                  placeholder={t('edPlaceholderShortBio')}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm resize-none bg-white text-slate-900"
                />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-700">{t('edSocialLinks')}</span>
                    <button onClick={() => addLink(member.id)} className="text-[10px] text-indigo-600 font-medium hover:underline">
                      {t('edAddLink')}
                    </button>
                  </div>
                  {member.links.map((link) => (
                    <div key={link.id} className="flex gap-2 items-center p-2 bg-slate-50 rounded border border-slate-200">
                      <select
                        value={link.platform}
                        onChange={(e) => updateLink(member.id, link.id, 'platform', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900"
                      >
                        {platformOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(member.id, link.id, 'url', e.target.value)}
                        placeholder={t('edPlaceholderUrl')}
                        className="flex-2 px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900"
                      />
                      <button onClick={() => removeLink(member.id, link.id)} className="text-red-500 hover:text-red-700 p-1">
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
