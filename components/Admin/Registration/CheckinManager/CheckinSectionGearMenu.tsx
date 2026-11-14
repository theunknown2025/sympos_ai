import React, { useState } from 'react';
import { Settings } from 'lucide-react';

interface CheckinSectionGearMenuProps {
  menuLabel: string;
  onConfigure: () => void;
  disabled?: boolean;
  disabledHint?: string;
}

const CheckinSectionGearMenu: React.FC<CheckinSectionGearMenuProps> = ({
  menuLabel,
  onConfigure,
  disabled = false,
  disabledHint,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        title={disabled ? disabledHint : menuLabel}
        aria-label={menuLabel}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => {
          if (disabled) return;
          setMenuOpen((open) => !open);
        }}
        className={`p-2 rounded-lg border transition-colors ${
          disabled
            ? 'border-slate-200 text-slate-300 cursor-not-allowed'
            : 'border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50'
        }`}
      >
        <Settings size={18} />
      </button>
      {menuOpen && !disabled ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[14rem] py-1 bg-white border border-slate-200 rounded-lg shadow-xl"
          >
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                onConfigure();
                setMenuOpen(false);
              }}
            >
              {menuLabel}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default CheckinSectionGearMenu;
