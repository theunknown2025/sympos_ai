import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Committee, ReviewCommitteeMember, ScientificCommitteeConfig, ScientificSubCommittee } from '../../../../types';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Users,
  Loader2,
  Crown,
  Layers,
} from 'lucide-react';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { useAuth } from '../../../../hooks/useAuth';
import { getCommittees } from '../../../../services/committeeService';
import { getCommitteeMembers } from '../../../../services/committeeMemberService';
import CommitteePersonFields from '../shared/CommitteePersonFields';
import {
  EVENT_TOPIC_ICON_OPTIONS,
  resolveEventTopicIcon,
} from '../shared/eventTopicIcons';
import {
  buildScientificCommitteeFromSaved,
  createEmptyPerson,
  createEmptySubCommittee,
} from '../../../../utils/scientificCommitteeUtils';

interface CommitteeEditorProps {
  scientificCommittee: ScientificCommitteeConfig;
  onChange: (config: ScientificCommitteeConfig) => void;
}

const CommitteeEditor: React.FC<CommitteeEditorProps> = ({ scientificCommittee, onChange }) => {
  const { t } = useAdminTranslation('pageBuilder');
  const { currentUser } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>('event-chair');
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
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
      const map = new Map(membersList.map((m) => [m.id, m]));
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

  const updateConfig = (patch: Partial<ScientificCommitteeConfig>) => {
    onChange({ ...scientificCommittee, ...patch });
  };

  const setEventChair = (chair: ScientificCommitteeConfig['eventChair']) => {
    updateConfig({ eventChair: chair });
  };

  const updateSubCommittee = (id: string, patch: Partial<ScientificSubCommittee>) => {
    updateConfig({
      subCommittees: scientificCommittee.subCommittees.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  };

  const addSubCommittee = () => {
    const sub = createEmptySubCommittee({ name: t('edCommitteeNewSubDefault') });
    updateConfig({ subCommittees: [...scientificCommittee.subCommittees, sub] });
    setExpandedSubId(sub.id);
  };

  const removeSubCommittee = (id: string) => {
    updateConfig({
      subCommittees: scientificCommittee.subCommittees.filter((s) => s.id !== id),
    });
    if (expandedSubId === id) setExpandedSubId(null);
  };

  const addSubMember = (subId: string) => {
    const sub = scientificCommittee.subCommittees.find((s) => s.id === subId);
    if (!sub) return;
    updateSubCommittee(subId, {
      members: [...sub.members, createEmptyPerson({ name: t('edDefaultNewCommitteeMember') })],
    });
  };

  const updateSubMember = (
    subId: string,
    memberId: string,
    person: ScientificSubCommittee['members'][number]
  ) => {
    const sub = scientificCommittee.subCommittees.find((s) => s.id === subId);
    if (!sub) return;
    updateSubCommittee(subId, {
      members: sub.members.map((m) => (m.id === memberId ? person : m)),
    });
  };

  const removeSubMember = (subId: string, memberId: string) => {
    const sub = scientificCommittee.subCommittees.find((s) => s.id === subId);
    if (!sub) return;
    updateSubCommittee(subId, {
      members: sub.members.filter((m) => m.id !== memberId),
    });
  };

  const handlePickSavedCommittee = (saved: Committee) => {
    const imported = buildScientificCommitteeFromSaved(saved, reviewMembersById, {
      president: t('edCommitteePresidentLabel'),
      mainMember: (field) => t('edCommitteeImportMainMemberRole', { field }),
      subChair: (field) => t('edCommitteeImportSubChairRole', { field }),
      subMember: (field) => t('edCommitteeImportSubMemberRole', { field }),
    });
    if (!imported.eventChair && imported.subCommittees.length === 0) return;
    onChange(imported);
    setDropdownOpen(false);
  };

  const memberCount =
    (scientificCommittee.eventChair?.name ? 1 : 0) +
    scientificCommittee.subCommittees.reduce(
      (acc, s) => acc + (s.chair.name ? 1 : 0) + s.members.length,
      0
    );

  const hasSavedCommittees = savedCommittees.length > 0;
  const includeDisabled = loadingSaved || !currentUser?.id;

  const dropdownLabel = useMemo(() => {
    if (loadingSaved) return t('edIncludeCommitteeLoading');
    return t('edIncludeCommittee');
  }, [loadingSaved, t]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">{t('edCommitteeMembersSummary', { count: memberCount })}</span>
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
        </div>
      </div>

      {/* Event Chair */}
      <div className="border border-indigo-200 rounded-lg overflow-hidden bg-indigo-50/30">
        <button
          type="button"
          className="w-full p-3 bg-white flex justify-between items-center hover:bg-indigo-50/50 transition-colors text-left"
          onClick={() => setExpandedSection(expandedSection === 'event-chair' ? null : 'event-chair')}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
              <Crown size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">{t('edCommitteeEventChair')}</p>
              <p className="text-xs text-slate-500 truncate">
                {scientificCommittee.eventChair?.name || t('edCommitteeEventChairEmpty')}
              </p>
            </div>
          </div>
          {expandedSection === 'event-chair' ? (
            <ChevronUp size={16} className="text-slate-400 shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-slate-400 shrink-0" />
          )}
        </button>

        {expandedSection === 'event-chair' && (
          <div className="p-4 border-t border-indigo-100 space-y-3 bg-white">
            {!scientificCommittee.eventChair ? (
              <button
                type="button"
                onClick={() => setEventChair(createEmptyPerson({ role: t('edCommitteePresidentLabel') }))}
                className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800"
              >
                <Plus size={12} /> {t('edCommitteeAddEventChair')}
              </button>
            ) : (
              <>
                <CommitteePersonFields
                  person={scientificCommittee.eventChair}
                  onChange={(p) => setEventChair(p)}
                />
                <button
                  type="button"
                  onClick={() => setEventChair(null)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 size={12} /> {t('edCommitteeRemoveEventChair')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sub-committees */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {t('edCommitteeSubCommittees')}
          </span>
          <button
            type="button"
            onClick={addSubCommittee}
            className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800"
          >
            <Plus size={12} /> {t('edCommitteeAddSub')}
          </button>
        </div>

        {scientificCommittee.subCommittees.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-1">{t('edCommitteeNoSubYet')}</p>
        ) : (
          scientificCommittee.subCommittees.map((sub) => {
            const Icon = resolveEventTopicIcon(sub.icon);
            const isExpanded = expandedSubId === sub.id;

            return (
              <div key={sub.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <div className="p-3 bg-white flex justify-between items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80"
                    onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-indigo-600">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {sub.name || t('edCommitteeNewSubDefault')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t('edCommitteeSubSummary', {
                          chair: sub.chair.name ? 1 : 0,
                          members: sub.members.length,
                        })}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => removeSubCommittee(sub.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      aria-label={t('edCommitteeRemoveSub')}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button type="button" onClick={() => setExpandedSubId(isExpanded ? null : sub.id)} className="p-1">
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={16} className="text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 space-y-4 bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => updateSubCommittee(sub.id, { name: e.target.value })}
                        placeholder={t('edCommitteeSubNamePlaceholder')}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                      />
                      <select
                        value={sub.icon}
                        onChange={(e) =>
                          updateSubCommittee(sub.id, {
                            icon: e.target.value as ScientificSubCommittee['icon'],
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white text-slate-900"
                      >
                        {EVENT_TOPIC_ICON_OPTIONS.map((iconKey) => (
                          <option key={iconKey} value={iconKey}>
                            {iconKey}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3 space-y-2">
                      <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                        <Crown size={12} /> {t('edCommitteeSubChair')}
                      </p>
                      <CommitteePersonFields
                        person={sub.chair}
                        onChange={(p) => updateSubCommittee(sub.id, { chair: p })}
                        compact
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                          <Layers size={12} /> {t('edCommitteeSubMembers')}
                        </p>
                        <button
                          type="button"
                          onClick={() => addSubMember(sub.id)}
                          className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800"
                        >
                          <Plus size={12} /> {t('edAddCommitteeMember')}
                        </button>
                      </div>

                      {sub.members.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">{t('edCommitteeSubNoMembers')}</p>
                      ) : (
                        sub.members.map((member) => (
                          <div
                            key={member.id}
                            className="border border-slate-100 rounded-lg p-3 bg-slate-50/80 space-y-2"
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-medium text-slate-700 truncate">
                                {member.name || t('edDefaultNewCommitteeMember')}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeSubMember(sub.id, member.id)}
                                className="text-slate-400 hover:text-red-500 p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <CommitteePersonFields
                              person={member}
                              onChange={(p) => updateSubMember(sub.id, member.id, p)}
                              compact
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommitteeEditor;
