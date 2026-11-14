import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ConferenceConfig } from '../../../../types';

export type LandingPageView = 'home' | 'about';

export interface LandingPageNavSection {
  id: string;
  title: string;
}

interface LandingPageHeaderProps {
  config: ConferenceConfig;
  activeView: LandingPageView;
  homeLabel: string;
  aboutLabel: string;
  showAbout: boolean;
  sections: LandingPageNavSection[];
  onNavigateHome: () => void;
  onNavigateAbout?: () => void;
  onSectionClick?: (sectionId: string) => void;
  /** Compact padding for builder preview. */
  compact?: boolean;
}

/** Sticky header matching the landing page preview chrome. */
const LandingPageHeader: React.FC<LandingPageHeaderProps> = ({
  config,
  activeView,
  homeLabel,
  aboutLabel,
  showAbout,
  sections,
  onNavigateHome,
  onNavigateAbout,
  onSectionClick,
  compact = false,
}) => {
  const [homeOpen, setHomeOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const header = config.header || {
    showLogo: true,
    showTitle: true,
    showActionButton: false,
    actionButtonText: '',
    actionButtonUrl: '',
  };

  const padX = compact ? 'px-6' : 'px-4 sm:px-6';

  const navClass = (active: boolean) =>
    `text-xs font-semibold transition-colors uppercase tracking-wider ${
      active ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'
    }`;

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openHomeMenu = () => {
    clearCloseTimer();
    setHomeOpen(true);
  };

  const scheduleCloseHomeMenu = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setHomeOpen(false), 150);
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setHomeOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      clearCloseTimer();
    };
  }, []);

  const handleHomeClick = () => {
    onNavigateHome();
    if (sections.length > 0) {
      setHomeOpen((open) => !open);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    onNavigateHome();
    setHomeOpen(false);
    // Allow home view to mount before scrolling (public viewer / preview).
    window.setTimeout(() => onSectionClick?.(sectionId), 0);
  };

  // Fill down 3 rows, then next column (3 elements per column).
  const submenuGridStyle: React.CSSProperties | undefined =
    sections.length > 0
      ? {
          display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(3, auto)',
          gridAutoColumns: 'minmax(0, 1fr)',
          columnGap: '1.5rem',
          rowGap: '0.25rem',
        }
      : undefined;

  return (
    <nav
      ref={headerRef}
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm"
      onMouseLeave={scheduleCloseHomeMenu}
    >
      <div className={`max-w-7xl mx-auto h-16 flex items-center justify-between ${padX}`}>
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left shrink-0"
        >
          {header.showLogo && (
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
          )}
          {header.showTitle && (
            <span className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-none">
              {config.title || 'Landing Page'}
            </span>
          )}
        </button>

        <div className="hidden md:flex items-center gap-6">
          <div
            className="relative"
            onMouseEnter={openHomeMenu}
            onFocus={openHomeMenu}
          >
            <button
              type="button"
              onClick={handleHomeClick}
              aria-expanded={homeOpen}
              aria-haspopup="true"
              className={`inline-flex items-center gap-1 ${navClass(activeView === 'home' || homeOpen)}`}
            >
              {homeLabel}
              {sections.length > 0 && (
                <ChevronDown
                  size={14}
                  className={`transition-transform ${homeOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>
          </div>

          {showAbout && onNavigateAbout && (
            <button
              type="button"
              onClick={() => {
                setHomeOpen(false);
                onNavigateAbout();
              }}
              className={navClass(activeView === 'about')}
            >
              {aboutLabel}
            </button>
          )}
        </div>

        {header.showActionButton ? (
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 shrink-0"
          >
            {header.actionButtonText || 'Register'}
          </button>
        ) : (
          <div className="w-[1px] shrink-0" aria-hidden />
        )}
      </div>

      {/* Full-header-width Home submenu */}
      {homeOpen && sections.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full border-t border-slate-100 bg-white shadow-lg"
          onMouseEnter={openHomeMenu}
          onMouseLeave={scheduleCloseHomeMenu}
        >
          <div className={`max-w-7xl mx-auto py-4 ${padX}`}>
            <div style={submenuGridStyle} className="w-full">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionClick(section.id)}
                  className="text-left text-xs font-semibold text-slate-600 hover:text-indigo-600 uppercase tracking-wider py-2 px-1 truncate"
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingPageHeader;
