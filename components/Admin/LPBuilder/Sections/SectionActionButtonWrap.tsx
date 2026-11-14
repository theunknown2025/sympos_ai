import React from 'react';
import type { ConferenceConfig, HeroButton } from '../../../../types';
import { getSectionActionButtons } from '../shared/landingPageActionButton';
import LandingPageCtaButton from './LandingPageCtaButton';

type Section = ConferenceConfig['sections'][number];

interface SectionActionButtonWrapProps {
  section: Section;
  children: React.ReactNode;
  onActionClick: (btn: HeroButton) => void;
}

function ctaRowJustifyClass(titleAlignment: Section['titleAlignment']): string {
  if (titleAlignment === 'left') return 'justify-start';
  if (titleAlignment === 'right') return 'justify-end';
  return 'justify-center';
}

function sectionCtaFooterShellClass(sectionType: Section['type']): string {
  switch (sectionType) {
    case 'submission':
    case 'speakers':
    case 'faq':
    case 'pricing':
      return 'bg-slate-50';
    case 'eventTopics':
    case 'committee':
    case 'agenda':
    case 'partners':
    case 'images':
    case 'contact':
    case 'about':
      return 'bg-white';
    case 'team':
      return 'bg-slate-100';
    default:
      return 'bg-transparent';
  }
}

const SectionActionButtonWrap: React.FC<SectionActionButtonWrapProps> = ({
  section,
  children,
  onActionClick,
}) => {
  if (section.type === 'hero') {
    return <>{children}</>;
  }

  const buttons = getSectionActionButtons(section);
  if (buttons.length === 0) {
    return <>{children}</>;
  }

  const shell = sectionCtaFooterShellClass(section.type);

  return (
    <>
      {children}
      <div className={`w-full px-8 pb-16 -mt-20 ${shell}`}>
        <div
          className={`max-w-7xl mx-auto flex flex-wrap gap-6 ${ctaRowJustifyClass(
            section.titleAlignment
          )}`}
        >
          {buttons.map((btn) => (
            <LandingPageCtaButton key={btn.id} button={btn} onClick={onActionClick} />
          ))}
        </div>
      </div>
    </>
  );
};

export default SectionActionButtonWrap;
