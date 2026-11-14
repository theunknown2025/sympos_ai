import React from 'react';

interface LandingPageFooterProps {
  title: string;
  compact?: boolean;
}

/** Footer matching the landing page preview chrome. */
const LandingPageFooter: React.FC<LandingPageFooterProps> = ({ title, compact = false }) => {
  return (
    <footer className="bg-slate-900 text-white py-12 text-center text-xs border-t border-slate-800">
      <div
        className={`max-w-7xl mx-auto flex flex-col items-center gap-4 ${
          compact ? 'px-6' : 'px-4 sm:px-6'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold">
            S
          </div>
          <span className="font-bold uppercase tracking-widest">{title}</span>
        </div>
        <p className="text-slate-500">© {new Date().getFullYear()} Built with Sympose AI Platform.</p>
      </div>
    </footer>
  );
};

export default LandingPageFooter;
