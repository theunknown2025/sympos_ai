import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommitteeMember, Committee, ReviewCommitteeMember, SocialLink } from '../../../../types';
import { Plus, Trash2, ImageIcon, User, ChevronUp, ChevronDown, Users, Loader2 } from 'lucide-react';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { useAuth } from '../../../../hooks/useAuth';
import { getCommittees } from '../../../../services/committeeService';
import { getCommitteeMembers } from '../../../../services/committeeMemberService';

interface CommitteeEditorProps {
  committee: CommitteeMember[];
  onChange: (members: CommitteeMember[]) => void;
}

function formatAffiliation(a: ReviewCommitteeMember['affiliation']): string {
  if (!a || typeof a !== 'object') return '';
  const bits = [
    a.position,
    a.institution || a.university || a.organization,
    a.department,
    a.faculty,
    a.country,
  ].filter(Boolean);
  return [...new Set(bits.map(String))].join(' · ');
}

function identifiersToSocials(rm: ReviewCommitteeMember): SocialLink[] {
  const out: SocialLink[] = [];
  const { identifiers } = rm;
  let n = 0;
  const push = (platform: SocialLink['platform'], url: string) => {
    const u = url.trim();
    if (!u) return;
    out.push({
      id: `soc-${rm.id}-${n++}`,
      platform,
      url: u.startsWith('http') ? u : `https://${u}`,
    });
  };
  if (identifiers.orcidId) {
    const u = identifiers.orcidId.trim();
    push('website', u.includes('/') ? u : `https://orcid.org/${u}`);
  }
  if (identifiers.googleScholar) push('website', identifiers.googleScholar);
  if (identifiers.researchGate) push('website', identifiers.researchGate);
  for (const link of identifiers.otherLinks || []) {
    if (link?.trim()) push('website', link);
  }
  return out;
}

function orderedUniqueMemberIds(field: {
  chairMemberId?: string | null;
  memberIds: string[];
}): string[] {
  const orderedIds: string[] = [];
  const added = new Set<string>();
  if (field.chairMemberId) {
    orderedIds.push(field.chairMemberId);
    added.add(field.chairMemberId);
  }
  for (const mid of field.memberIds) {
    if (!added.has(mid)) {
      orderedIds.push(mid);
      added.add(mid);
    }
  }
  return orderedIds;
}

function reviewToCommitteeMember(
  rm: ReviewCommitteeMember,
  opts: {
    landingTier: NonNullable<CommitteeMember['landingTier']>;
    subcommitteeName: string;
    role: string;
  }
): CommitteeMember {
  const name = [rm.title, rm.firstName, rm.lastName].filter(Boolean).join(' ').trim();
  return {
    id: `rcm-${rm.id}`,
    name,
    role: opts.role,
    affiliation: formatAffiliation(rm.affiliation),
    bio: '',
    imageUrl: '',
    socials: identifiersToSocials(rm),
    landingTier: opts.landingTier,
    subcommitteeName: opts.subcommitteeName,
  };
}

function buildImportedMembers(
  saved: Committee,
  membersById: Map<string, ReviewCommitteeMember>,
  t: (key: string, opts?: Record<string, string | number>) => string
): CommitteeMember[] {
  const fields = saved.fieldsOfIntervention;
  if (fields.length === 0) return [];

  const result: CommitteeMember[] = [];
  const seen = new Set<string>();

  const mainField = fields[0];
  const restFields = fields.slice(1);

  // President: chair of the first field (main committee)
  if (mainField.chairMemberId) {
    const rm = membersById.get(mainField.chairMemberId);
    if (rm) {
      seen.add(mainField.chairMemberId);
      result.push(
        reviewToCommitteeMember(rm, {
          landingTier: 'president',
          subcommitteeName: mainField.name,
          role: t('edCommitteePresidentLabel'),
        })
      );
    }
  }

  for (const memberId of orderedUniqueMemberIds(mainField)) {
    if (seen.has(memberId)) continue;
    const rm = membersById.get(memberId);
    if (!rm) continue;
    seen.add(memberId);
    result.push(
      reviewToCommitteeMember(rm, {
        landingTier: 'member',
        subcommitteeName: mainField.name,
        role: t('edCommitteeImportMainMemberRole', { field: mainField.name }),
      })
    );
  }

  for (const field of restFields) {
    if (field.chairMemberId && !seen.has(field.chairMemberId)) {
      const rm = membersById.get(field.chairMemberId);
      if (rm) {
        seen.add(field.chairMemberId);
        result.push(
          reviewToCommitteeMember(rm, {
            landingTier: 'subcommittee_chair',
            subcommitteeName: field.name,
            role: t('edCommitteeImportSubChairRole', { field: field.name }),
          })
        );
      }
    }
    for (const memberId of orderedUniqueMemberIds(field)) {
      if (seen.has(memberId)) continue;
      const rm = membersById.get(memberId);
      if (!rm) continue;
      seen.add(memberId);
      result.push(
        reviewToCommitteeMember(rm, {
          landingTier: 'member',
          subcommitteeName: field.name,
          role: t('edCommitteeImportSubMemberRole', { field: field.name }),
        })
      );
    }
  }

  return result;
}

function mergeImported(current: CommitteeMember[], imported: CommitteeMember[]): CommitteeMember[] {
  const existing = new Set(current.filter((m) => m.id.startsWith('rcm-')).map((m) => m.id));
  const additions = imported.filter((m) => !existing.has(m.id));
  return [...current, ...additions];
}

const CommitteeEditor: React.FC<CommitteeEditorProps> = ({ committee, onChange }) => {
  const { t } = useAdminTranslation('pageBuilder');
  const { currentUser } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedCommittees, setSavedCommittees] = useState<Committee[]>([]);
  const [reviewMembersById, setReviewMembersById] = useState<Map<string, ReviewCommitteeMember>>(new Map());
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadSavedCommittees = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoadingSaved(true);
      const [committeesList, membersList] = await Promise.all([
        getCommittees(currentUser.id),
        getCommitteeMembers(currentUser.id),
      ]);
      setSavedCommittees(committeesList);
      const map = new Map<string, ReviewCommitteeMember>();
      membersList.forEach((m) => map.set(m.id, m));
      setReviewMembersById(map);
    } catch (e) {
      console.error('CommitteeEditor: failed to load saved committees', e);
    } finally {
      setLoadingSaved(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadSavedCommittees();
  }, [loadSavedCommittees]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [dropdownOpen]);

  const addMember = () => {
    const newMember: CommitteeMember = {
      id: Date.now().toString(),
      name: t('edDefaultNewCommitteeMember'),
      role: t('edDefaultRoleLabel'),
      affiliation: t('edDefaultAffiliation'),
      bio: '',
      imageUrl: '',
      socials: [],
    };
    onChange([...committee, newMember]);
    setExpandedId(newMember.id);
  };

  const removeMember = (id: string) => {
    onChange(committee.filter((c) => c.id !== id));
  };

  const updateMember = (id: string, field: keyof CommitteeMember, value: any) => {
    onChange(committee.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handlePickSavedCommittee = (saved: Committee) => {
    const imported = buildImportedMembers(saved, reviewMembersById, t);
    if (imported.length === 0) return;
    onChange(mergeImported(committee, imported));
    setDropdownOpen(false);
  };

  const hasSavedCommittees = savedCommittees.length > 0;
  const includeDisabled = loadingSaved || !currentUser?.id;

  const dropdownLabel = useMemo(() => {
    if (loadingSaved) return t('edIncludeCommitteeLoading');
    return t('edIncludeCommittee');
  }, [loadingSaved, t]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">{t('edCommitteeMembersSummary', { count: committee.length })}</span>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              disabled={includeDisabled}
              onClick={() => setDropdownOpen((o) => !o)}
              className="text-xs flex items-center gap-1 px-2 py-1.5 rounded border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              aria-label={t('edIncludeCommitteeDropdownAria')}
            >
              {loadingSaved ? <Loader2 size={12} className="animate-spin shrink-0" /> : <Users size={12} />}
              {dropdownLabel}
              <ChevronDown size={12} className={`shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <ul
                role="listbox"
                className="absolute right-0 z-20 mt-1 max-h-52 min-w-[220px] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg text-left"
              >
                {!hasSavedCommittees ? (
                  <li className="px-3 py-2 text-xs text-slate-500 max-w-xs">{t('edIncludeCommitteeEmpty')}</li>
                ) : (
                  savedCommittees.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        role="option"
                        className="w-full px-3 py-2 text-left text-xs text-slate-800 hover:bg-indigo-50"
                        onClick={() => handlePickSavedCommittee(c)}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <button onClick={addMember} className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800">
            <Plus size={12} /> {t('edAddCommitteeMember')}
          </button>
        </div>
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
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-emerald-500" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-800 truncate">{member.name || t('edDefaultNewCommitteeMember')}</p>
                  <p className="text-xs text-slate-500 truncate">{member.role || t('edNoTitleYet')}</p>
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
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={member.role}
                    onChange={(e) => updateMember(member.id, 'role', e.target.value)}
                    placeholder={t('edPlaceholderRoleChair')}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                  />
                  <input
                    type="text"
                    value={member.affiliation}
                    onChange={(e) => updateMember(member.id, 'affiliation', e.target.value)}
                    placeholder={t('edPlaceholderAffiliation')}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitteeEditor;
