import React from 'react';
import {
  ArrowRight,
  ClipboardList,
  Download,
  Image as ImageIcon,
  Link2,
  Video,
} from 'lucide-react';
import type { HeroButton } from '../../../../types';
import { resolveLandingPageActionTarget } from '../shared/landingPageActionButton';

/** Matches Call for Papers (SubmissionSection) CTA button layout and design. */
export function getLandingPageCtaButtonClassName(style: HeroButton['style']): string {
  const base =
    'px-10 py-4 rounded-xl font-bold transition-all transform hover:-translate-y-1 active:scale-95 inline-flex items-center gap-3 shadow-lg';
  if (style === 'secondary') {
    return `${base} bg-white text-slate-700 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 shadow-slate-200`;
  }
  return `${base} bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200`;
}

export function LandingPageCtaTrailingIcon({ button }: { button: HeroButton }) {
  const action = resolveLandingPageActionTarget(button);
  if (action === 'document') return <Download size={18} />;
  if (action === 'image') return <ImageIcon size={18} />;
  if (action === 'video') return <Video size={18} />;
  if (action === 'form') return <ClipboardList size={18} />;
  if (action === 'link') return <Link2 size={18} />;
  return <ArrowRight size={18} />;
}

interface LandingPageCtaButtonProps {
  button: HeroButton;
  onClick: (button: HeroButton) => void;
}

const LandingPageCtaButton: React.FC<LandingPageCtaButtonProps> = ({ button, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(button)}
    className={getLandingPageCtaButtonClassName(button.style)}
  >
    {button.text}
    <LandingPageCtaTrailingIcon button={button} />
  </button>
);

export default LandingPageCtaButton;
