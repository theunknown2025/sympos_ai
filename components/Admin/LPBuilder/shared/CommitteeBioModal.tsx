import React, { useEffect } from 'react';
import { X, User, Mail, Linkedin, GraduationCap, ExternalLink, Crown } from 'lucide-react';
import type { EventTopicIcon, ScientificCommitteePerson } from '../../../../types';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { normalizePersonLinkUrl } from '../../../../utils/scientificCommitteeUtils';
import { resolveEventTopicIcon } from './eventTopicIcons';

export interface CommitteeBioModalContext {
  committeeName: string;
  committeeIcon?: EventTopicIcon;
  isEventChair?: boolean;
  memberRoleTitle: string;
}

interface CommitteeBioModalProps {
  person: ScientificCommitteePerson;
  context: CommitteeBioModalContext;
  onClose: () => void;
}

const CommitteeBioModal: React.FC<CommitteeBioModalProps> = ({ person, context, onClose }) => {
  const { t } = useAdminTranslation('pageBuilder');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const linkedinUrl = person.linkedin?.trim() ? normalizePersonLinkUrl(person.linkedin) : '';
  const email = person.email?.trim() || '';
  const hasLinks = email || linkedinUrl || person.links.some((l) => l.url?.trim());

  const linkClass =
    'inline-flex items-center gap-1.5 text-sm text-indigo-200/90 hover:text-white transition-colors underline-offset-2 hover:underline';

  const CommitteeIcon = context.isEventChair ? Crown : resolveEventTopicIcon(context.committeeIcon);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="committee-bio-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[min(85vh,720px)] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Committee context header */}
        <header className="shrink-0 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-800 text-white px-6 sm:px-8 pt-6 pb-5 sm:pt-7 sm:pb-6 pr-14">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
              <CommitteeIcon size={context.isEventChair ? 30 : 32} className="text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/90 mb-1">
                {t('edSecCommitteeModalCommitteeLabel')}
              </p>
              <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-bold leading-tight tracking-tight truncate">
                {context.committeeName}
              </h2>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-lg font-medium text-indigo-100/95 leading-snug">
                {context.memberRoleTitle}
              </p>
            </div>
          </div>
        </header>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={t('edSecCommitteeCloseBio')}
        >
          <X size={22} />
        </button>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          <aside className="md:w-[42%] lg:w-[38%] shrink-0 bg-gradient-to-b from-slate-800 to-slate-900 text-white px-6 sm:px-8 py-7 sm:py-8 flex flex-col items-center text-center overflow-y-auto md:max-h-full max-h-[36%]">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-4 border-white/15 shadow-2xl mb-5 bg-white/5">
              {person.imageUrl ? (
                <img src={person.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/35">
                  <User size={64} strokeWidth={1.25} />
                </div>
              )}
            </div>

            <h3
              id="committee-bio-modal-title"
              className="text-xl sm:text-2xl font-bold leading-tight tracking-tight"
            >
              {person.name || t('edSecCommitteeUnnamed')}
            </h3>

            {person.role ? (
              <p className="mt-2 text-indigo-100/90 text-sm sm:text-base font-medium">{person.role}</p>
            ) : null}

            {person.establishment ? (
              <p className="mt-1 text-white/70 text-sm leading-relaxed">{person.establishment}</p>
            ) : null}

            {hasLinks ? (
              <div className="mt-6 flex flex-col items-center gap-2.5 w-full">
                {email ? (
                  <a href={`mailto:${email}`} className={linkClass}>
                    <Mail size={15} className="shrink-0 opacity-80" />
                    <span className="truncate max-w-[240px]">{email}</span>
                  </a>
                ) : null}
                {linkedinUrl ? (
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    <Linkedin size={15} className="shrink-0 opacity-80" />
                    LinkedIn
                  </a>
                ) : null}
                {person.links.map((link) => {
                  const url = normalizePersonLinkUrl(link.url);
                  if (!url) return null;
                  const label =
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
                      className={linkClass}
                    >
                      <Icon size={15} className="shrink-0 opacity-80" />
                      {label}
                    </a>
                  );
                })}
              </div>
            ) : null}
          </aside>

          <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden border-t md:border-t-0 border-slate-100">
            <div className="shrink-0 px-6 sm:px-10 pt-5 sm:pt-6 pb-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                {t('edSecCommitteeBioHeading')}
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 sm:px-10 pb-8 sm:pb-10">
              <p className="text-slate-600 text-base sm:text-[1.0625rem] leading-[1.8] whitespace-pre-wrap font-light">
                {person.bio?.trim() || t('edSecCommitteeNoBio')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeBioModal;
