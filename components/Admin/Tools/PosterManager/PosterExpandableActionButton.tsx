import React from 'react';

type PosterExpandableActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
};

const PosterExpandableActionButton: React.FC<PosterExpandableActionButtonProps> = ({
  icon,
  label,
  title,
  onClick,
  active = false,
  disabled = false,
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`group inline-flex items-center h-8 rounded-lg border overflow-hidden transition-all duration-300 ease-out w-8 hover:w-auto hover:max-w-[11rem] hover:px-2 hover:gap-1.5 disabled:opacity-50 disabled:pointer-events-none ${
      active
        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
    }`}
  >
    <span className="flex items-center justify-center w-8 h-8 shrink-0">{icon}</span>
    <span className="text-xs font-medium whitespace-nowrap overflow-hidden max-w-0 opacity-0 group-hover:max-w-[9rem] group-hover:opacity-100 transition-all duration-300 ease-out">
      {label}
    </span>
  </button>
);

export default PosterExpandableActionButton;
