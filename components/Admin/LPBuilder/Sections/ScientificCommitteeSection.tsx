import React from 'react';
import { CommitteeMember } from '../../../../types';
import { User, Linkedin, Twitter, Globe, Award, Crown } from 'lucide-react';
import { isArabic } from '../../../../utils/languageDetection';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';

interface ScientificCommitteeSectionProps {
  members: CommitteeMember[];
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

function inferMainFieldName(members: CommitteeMember[]): string {
  const president = members.find((m) => m.landingTier === 'president');
  if (president?.subcommitteeName) return president.subcommitteeName;
  const firstSubChairIdx = members.findIndex((m) => m.landingTier === 'subcommittee_chair');
  const before = firstSubChairIdx === -1 ? members : members.slice(0, firstSubChairIdx);
  const firstMain = before.find((m) => m.landingTier === 'member' && m.subcommitteeName);
  return firstMain?.subcommitteeName ?? '';
}

function buildStructuredView(members: CommitteeMember[]) {
  const mainName = inferMainFieldName(members);
  const president = members.find((m) => m.landingTier === 'president');
  const mainMembers: CommitteeMember[] = [];
  const subSections: { fieldName: string; chair: CommitteeMember; members: CommitteeMember[] }[] = [];

  for (const m of members) {
    if (!m.landingTier) continue;
    if (m.landingTier === 'president') continue;
    if (m.landingTier === 'member' && m.subcommitteeName === mainName) {
      mainMembers.push(m);
      continue;
    }
    if (m.landingTier === 'subcommittee_chair') {
      subSections.push({
        fieldName: m.subcommitteeName || '',
        chair: m,
        members: [],
      });
      continue;
    }
    if (m.landingTier === 'member' && m.subcommitteeName !== mainName) {
      const last = subSections[subSections.length - 1];
      if (last && m.subcommitteeName === last.fieldName) {
        last.members.push(m);
      }
    }
  }

  return { president, mainMembers, mainFieldLabel: mainName, subSections };
}

const CommitteeSocials: React.FC<{ member: CommitteeMember; emptyLabel: string }> = ({
  member,
  emptyLabel,
}) => (
  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50 w-full justify-center opacity-70 hover:opacity-100 transition-opacity">
    {member.socials.map((social) => (
      <a
        key={social.id}
        href={social.url}
        className="text-slate-400 hover:text-indigo-600 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {social.platform === 'linkedin' && <Linkedin size={16} />}
        {social.platform === 'twitter' && <Twitter size={16} />}
        {social.platform === 'website' && <Globe size={16} />}
      </a>
    ))}
    {member.socials.length === 0 && <span className="text-[10px] text-slate-300 italic">{emptyLabel}</span>}
  </div>
);

const MemberCard: React.FC<{ member: CommitteeMember; emptyLabel: string }> = ({ member, emptyLabel }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center group">
    <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-slate-100 group-hover:border-indigo-100 transition-colors">
      {member.imageUrl ? (
        <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
          <User size={32} />
        </div>
      )}
    </div>
    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{member.name}</h3>
    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">{member.role}</span>
    <p className="text-sm text-slate-500 font-medium mb-3">{member.affiliation}</p>
    <CommitteeSocials member={member} emptyLabel={emptyLabel} />
  </div>
);

const SubCommitteeChairCard: React.FC<{ member: CommitteeMember; emptyLabel: string }> = ({
  member,
  emptyLabel,
}) => (
  <div className="bg-gradient-to-br from-amber-50/90 to-white rounded-xl p-6 border-2 border-amber-200 shadow-sm flex flex-col items-center text-center shrink-0 w-full lg:w-72">
    <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-amber-200">
      {member.imageUrl ? (
        <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-amber-50 flex items-center justify-center text-amber-300">
          <User size={40} />
        </div>
      )}
    </div>
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold uppercase tracking-wide mb-2">
      <Crown size={14} className="text-amber-700" />
      {member.role}
    </div>
    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{member.name}</h3>
    <p className="text-sm text-slate-600 font-medium mb-2">{member.affiliation}</p>
    <CommitteeSocials member={member} emptyLabel={emptyLabel} />
  </div>
);

const ScientificCommitteeSection: React.FC<ScientificCommitteeSectionProps> = ({
  members,
  title = 'Scientific Committee',
  titleAlignment = 'center',
}) => {
  const { t } = useAdminTranslation('pageBuilder');
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass =
    titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);

  const structuredMode = members.some((m) => m.landingTier);
  const untiered = members.filter((m) => !m.landingTier);
  const view = buildStructuredView(members);

  const classicGrid = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} emptyLabel={t('edSecCommitteeNoLinks')} />
      ))}
    </div>
  );

  const structuredLayout = (
    <div className="space-y-16">
      {view.president && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/80 p-8 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center text-center md:text-left">
            <div className="shrink-0">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-indigo-100">
                {view.president.imageUrl ? (
                  <img
                    src={view.president.imageUrl}
                    alt={view.president.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-200">
                    <User size={56} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold uppercase tracking-wide">
                <Crown size={16} className="text-indigo-700" />
                {view.president.role}
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">{view.president.name}</h3>
              <p className="text-sm md:text-base text-slate-600 max-w-xl">{t('edSecCommitteePresidentIntro')}</p>
              {view.president.affiliation ? (
                <p className="text-base text-slate-700 font-medium">{view.president.affiliation}</p>
              ) : null}
              <div className="flex gap-3 pt-2 justify-center md:justify-start flex-wrap">
                {view.president.socials.map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    className="text-slate-500 hover:text-indigo-600 transition-colors p-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.platform === 'linkedin' && <Linkedin size={22} />}
                    {social.platform === 'twitter' && <Twitter size={22} />}
                    {social.platform === 'website' && <Globe size={22} />}
                  </a>
                ))}
                {view.president.socials.length === 0 && (
                  <span className="text-xs text-slate-400 italic">{t('edSecCommitteeNoLinks')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {view.mainMembers.length > 0 && (
        <div>
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl font-bold text-slate-900">{t('edSecCommitteeMainHeading')}</h3>
            {view.mainFieldLabel ? (
              <p className="text-slate-500 mt-1 text-sm md:text-base">{view.mainFieldLabel}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {view.mainMembers.map((member) => (
              <MemberCard key={member.id} member={member} emptyLabel={t('edSecCommitteeNoLinks')} />
            ))}
          </div>
        </div>
      )}

      {view.subSections.map((sub) => (
        <div key={sub.fieldName || sub.chair.id} className="border-t border-slate-100 pt-12">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
              {t('edSecCommitteeSubCommitteeHeading')}
            </p>
            <h3 className="text-2xl font-bold text-slate-900">{sub.fieldName}</h3>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
            <SubCommitteeChairCard member={sub.chair} emptyLabel={t('edSecCommitteeNoLinks')} />
            <div className="flex-1 w-full min-w-0">
              {sub.members.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sub.members.map((member) => (
                    <MemberCard key={member.id} member={member} emptyLabel={t('edSecCommitteeNoLinks')} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic py-6">{t('edSecCommitteeEmpty')}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {untiered.length > 0 && (
        <div className="border-t border-slate-100 pt-12">
          <h3 className="text-xl font-bold text-slate-900 mb-8">{t('edSecCommitteeAdditionalHeading')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {untiered.map((member) => (
              <MemberCard key={member.id} member={member} emptyLabel={t('edSecCommitteeNoLinks')} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="py-24 px-8 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
          <h2
            className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}
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

        {members.length > 0 ? (
          structuredMode ? structuredLayout : classicGrid
        ) : (
          <div className="h-48 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <Award size={48} className="mb-4 opacity-50" />
            <p className="font-medium">{t('edSecCommitteeEmpty')}</p>
            <p className="text-sm mt-1">{t('edSecCommitteeEmptyHint')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScientificCommitteeSection;
