import React, { useState } from 'react';
import { BarChart3, ChevronDown, Settings } from 'lucide-react';

interface OpportunityReportGearMenuProps {
  showReport: boolean;
  onShowReport: () => void;
  onHideReport: () => void;
}

const OpportunityReportGearMenu: React.FC<OpportunityReportGearMenuProps> = ({
  showReport,
  onShowReport,
  onHideReport,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const animateGear = hovered || menuOpen || showReport;

  return (
    <div
      className="relative shrink-0 z-30"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-lg border-2 shadow-sm transition-all ${
          showReport
            ? 'border-indigo-500 bg-indigo-600 text-white'
            : 'border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400'
        }`}
        aria-label="Report and options"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <Settings
          size={20}
          strokeWidth={2}
          className={`shrink-0 transition-transform duration-700 ease-in-out ${
            animateGear ? 'rotate-90' : ''
          } ${menuOpen ? 'animate-[spin_2.5s_linear_infinite]' : ''}`}
        />
        <span className="text-sm font-semibold whitespace-nowrap">
          {showReport ? 'Report open' : 'Report'}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[13rem] py-1 bg-white border border-slate-200 rounded-lg shadow-xl"
          >
            {showReport ? (
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                onClick={() => {
                  onHideReport();
                  setMenuOpen(false);
                }}
              >
                <BarChart3 size={16} className="text-indigo-600 shrink-0" />
                Hide report
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                onClick={() => {
                  onShowReport();
                  setMenuOpen(false);
                }}
              >
                <BarChart3 size={16} className="text-indigo-600 shrink-0" />
                Show report
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OpportunityReportGearMenu;
