import React from 'react';
import type { HeroButton } from '../../../../types';
import LandingPageCtaButton from './LandingPageCtaButton';

interface SectionActionButtonProps {
  button: HeroButton;
  onClick: (button: HeroButton) => void;
}

/** Single section CTA — styling aligned with SubmissionSection buttons. */
const SectionActionButton: React.FC<SectionActionButtonProps> = ({ button, onClick }) => (
  <LandingPageCtaButton button={button} onClick={onClick} />
);

export default SectionActionButton;
