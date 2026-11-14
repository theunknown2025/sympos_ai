import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Crown,
  Eye,
  GraduationCap,
  Linkedin,
  Mail,
  ExternalLink,
  User,
} from 'lucide-react';
import type { ScientificCommitteeConfig, ScientificCommitteePerson } from '../../../../types';
import { isArabic } from '../../../../utils/languageDetection';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { resolveEventTopicIcon } from '../shared/eventTopicIcons';
import CommitteeBioModal, { type CommitteeBioModalContext } from '../shared/CommitteeBioModal';
import { committeeHasContent, normalizePersonLinkUrl } from '../../../../utils/scientificCommitteeUtils';

interface ScientificCommitteeSectionProps {
  scientificCommittee: ScientificCommitteeConfig;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

type CommitteeTab = { id: string; label: string; kind: 'event-chair' | 'sub'; subId?: string };

const PersonLinksRow: React.FC<{ person: ScientificCommitteePerson; emptyLabel: string }> = ({
  person,
  emptyLabel,
}) => {
  const { t } = useAdminTranslation('pageBuilder');
  const linkedin = person.linkedin?.trim() ? normalizePersonLinkUrl(person.linkedin) : '';
  const email = person.email?.trim() || '';
  const hasLinks = email || linkedin || person.links.some((l) => l.url?.trim());

  if (!hasLinks) {
    return <span className="text-[10px] text-slate-300 italic">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {email ? (
        <a
          href={`mailto:${email}`}
          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
          title={email}
        >
          <Mail size={16} />
        </a>
      ) : null}
      {linkedin ? (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
          title="LinkedIn"
        >
          <Linkedin size={16} />
        </a>
      ) : null}
      {person.links.map((link) => {
        const url = normalizePersonLinkUrl(link.url);
        if (!url) return null;
        const title =
          link.type === 'orcid'
            ? 'ORCID'
            : link.type === 'google_scholar'
              ? 'Google Scholar'
              : link.label?.trim() || t('edSecCommitteeLinkOther');
        const Icon = link.type === 'google_scholar' ? GraduationCap : ExternalLink;
        return (
          <a
            key={link.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
            title={title}
          >
            <Icon size={16} />
          </a>
        );
      })}
    </div>
  );
};

const PersonCard: React.FC<{
  person: ScientificCommitteePerson;
  badge?: React.ReactNode;
  featured?: boolean;
  onViewBio: () => void;
  viewBioLabel: string;
  emptyLabel: string;
}> = ({ person, badge, featured, onViewBio, viewBioLabel, emptyLabel }) => (
  <article
    className={`relative flex flex-col items-center text-center group rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 ${
      featured
        ? 'bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 p-8 border-indigo-100'
        : 'bg-white p-5 border-slate-200'
    }`}
  >
    <button
      type="button"
      onClick={onViewBio}
      className="absolute top-3 right-3 p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors z-10"
      aria-label={viewBioLabel}
    >
      <Eye size={18} />
    </button>

    <div
      className={`rounded-full overflow-hidden mb-4 border-2 group-hover:border-indigo-100 transition-colors ${
        featured ? 'w-32 h-32 border-white shadow-lg ring-2 ring-indigo-100' : 'w-20 h-20 border-slate-100'
      }`}
    >
      {person.imageUrl ? (
        <img src={person.imageUrl} alt={person.name} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${featured ? 'bg-indigo-50 text-indigo-200' : 'bg-slate-50 text-slate-300'}`}>
          <User size={featured ? 48 : 32} />
        </div>
      )}
    </div>

    {badge}
    <h3 className={`font-bold text-slate-900 leading-tight mb-1 ${featured ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
      {person.name}
    </h3>
    {person.role ? (
      <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">{person.role}</span>
    ) : null}
    {person.establishment ? (
      <p className={`text-slate-500 font-medium mb-3 ${featured ? 'text-base' : 'text-sm'}`}>
        {person.establishment}
      </p>
    ) : null}
    {person.bio?.trim() ? (
      <p className="text-sm text-slate-600 line-clamp-3 mb-3 max-w-md">{person.bio}</p>
    ) : null}
    <div className="mt-auto pt-4 border-t border-slate-50 w-full">
      <PersonLinksRow person={person} emptyLabel={emptyLabel} />
    </div>
  </article>
);

const ScientificCommitteeSection: React.FC<ScientificCommitteeSectionProps> = ({
  scientificCommittee,
  title = 'Scientific Committee',
  titleAlignment = 'center',
}) => {
  const { t } = useAdminTranslation('pageBuilder');
  const [activeTabId, setActiveTabId] = useState<string>('event-chair');
  const [bioPerson, setBioPerson] = useState<{
    person: ScientificCommitteePerson;
    context: CommitteeBioModalContext;
  } | null>(null);

  const titleAlignClass =
    titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass =
    titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);

  const tabs: CommitteeTab[] = useMemo(() => {
    const list: CommitteeTab[] = [];
    if (scientificCommittee.eventChair?.name?.trim()) {
      list.push({
        id: 'event-chair',
        label: t('edSecCommitteeTabEventChair'),
        kind: 'event-chair',
      });
    }
    for (const sub of scientificCommittee.subCommittees) {
      if (!sub.name.trim() && !sub.chair.name.trim() && !sub.members.some((m) => m.name.trim())) continue;
      list.push({
        id: sub.id,
        label: sub.name.trim() || t('edCommitteeNewSubDefault'),
        kind: 'sub',
        subId: sub.id,
      });
    }
    return list;
  }, [scientificCommittee, t]);

  useEffect(() => {
    if (tabs.length === 0) return;
    if (!tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  useEffect(() => {
    if (!bioPerson) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBioPerson(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bioPerson]);

  const hasContent = committeeHasContent(scientificCommittee);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const activeSub =
    activeTab?.kind === 'sub'
      ? scientificCommittee.subCommittees.find((s) => s.id === activeTab.subId)
      : undefined;

  const viewBioLabel = (name: string) => t('edSecCommitteeViewBio', { name: name || t('edSecCommitteeUnnamed') });

  return (
    <>
      <div className="py-24 px-8 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className={`flex flex-col ${containerAlignClass} mb-12`}>
            <h2
              className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${
                isTitleArabic ? 'flex-row-reverse' : ''
              }`}
            >
              {isTitleArabic ? (
                <>
                  <span>{title}</span>
                  <Award size={32} className="text-indigo-600" />
                </>
              ) : (
                <>
                  <Award size={32} className="text-indigo-600" />
                  <span>{title}</span>
                </>
              )}
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('edSecCommitteeIntro')}</p>
          </div>

          {!hasContent ? (
            <div className="h-48 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
              <Award size={48} className="mb-4 opacity-50" />
              <p className="font-medium">{t('edSecCommitteeEmpty')}</p>
              <p className="text-sm mt-1">{t('edSecCommitteeEmptyHint')}</p>
            </div>
          ) : (
            <>
              {tabs.length > 1 && (
                <div
                  className="flex flex-wrap gap-2 justify-center mb-10 border-b border-slate-100 pb-1"
                  role="tablist"
                  aria-label={t('edSecCommitteeTabsAria')}
                >
                  {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    const SubIcon =
                      tab.kind === 'sub'
                        ? resolveEventTopicIcon(
                            scientificCommittee.subCommittees.find((s) => s.id === tab.subId)?.icon
                          )
                        : Crown;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
                          isActive
                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <SubIcon size={16} className="shrink-0" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <div role="tabpanel">
                {activeTab?.kind === 'event-chair' && scientificCommittee.eventChair ? (
                  <div className="max-w-2xl mx-auto">
                    <PersonCard
                      person={scientificCommittee.eventChair}
                      featured
                      onViewBio={() =>
                        setBioPerson({
                          person: scientificCommittee.eventChair!,
                          context: {
                            committeeName: t('edSecCommitteeTabEventChair'),
                            isEventChair: true,
                            memberRoleTitle:
                              scientificCommittee.eventChair!.role || t('edSecCommitteeTabEventChair'),
                          },
                        })
                      }
                      viewBioLabel={viewBioLabel(scientificCommittee.eventChair.name)}
                      emptyLabel={t('edSecCommitteeNoLinks')}
                      badge={
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-bold uppercase tracking-wide mb-3">
                          <Crown size={14} className="text-indigo-700" />
                          {t('edSecCommitteeTabEventChair')}
                        </div>
                      }
                    />
                  </div>
                ) : null}

                {activeTab?.kind === 'sub' && activeSub ? (
                  <div className="space-y-10">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                        {React.createElement(resolveEventTopicIcon(activeSub.icon), { size: 24 })}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">{activeSub.name}</h3>
                    </div>

                    {activeSub.chair.name.trim() ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-4 text-center">
                          {t('edCommitteeSubChair')}
                        </p>
                        <div className="max-w-sm mx-auto">
                          <PersonCard
                            person={activeSub.chair}
                            onViewBio={() =>
                              setBioPerson({
                                person: activeSub.chair,
                                context: {
                                  committeeName: activeSub.name,
                                  committeeIcon: activeSub.icon,
                                  memberRoleTitle: t('edCommitteeSubChair'),
                                },
                              })
                            }
                            viewBioLabel={viewBioLabel(activeSub.chair.name)}
                            emptyLabel={t('edSecCommitteeNoLinks')}
                            badge={
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold uppercase tracking-wide mb-2">
                                <Crown size={12} className="text-amber-700" />
                                {t('edCommitteeSubChair')}
                              </div>
                            }
                          />
                        </div>
                      </div>
                    ) : null}

                    {activeSub.members.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-6 text-center">
                          {t('edCommitteeSubMembers')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {activeSub.members.map((member) => (
                            <PersonCard
                              key={member.id}
                              person={member}
                              onViewBio={() =>
                                setBioPerson({
                                  person: member,
                                  context: {
                                    committeeName: activeSub.name,
                                    committeeIcon: activeSub.icon,
                                    memberRoleTitle: member.role || t('edCommitteeSubMemberLabel'),
                                  },
                                })
                              }
                              viewBioLabel={viewBioLabel(member.name)}
                              emptyLabel={t('edSecCommitteeNoLinks')}
                            />
                          ))}
                        </div>
                      </div>
                    ) : !activeSub.chair.name.trim() ? (
                      <p className="text-sm text-slate-400 italic text-center py-6">{t('edSecCommitteeEmpty')}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {bioPerson ? (
        <CommitteeBioModal
          person={bioPerson.person}
          context={bioPerson.context}
          onClose={() => setBioPerson(null)}
        />
      ) : null}
    </>
  );
};

export default ScientificCommitteeSection;
