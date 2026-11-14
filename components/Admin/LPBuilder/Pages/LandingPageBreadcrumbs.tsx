import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface LandingPageBreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface LandingPageBreadcrumbsProps {
  items: LandingPageBreadcrumbItem[];
}

/** In-landing-page breadcrumbs only (Home → event name). Not SymposAI account crumbs. */
const LandingPageBreadcrumbs: React.FC<LandingPageBreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600 mb-6">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight size={14} className="text-slate-400 shrink-0" />}
              {isLast || !item.onClick ? (
                <span
                  className={
                    isLast
                      ? 'text-slate-900 font-medium truncate max-w-[14rem] sm:max-w-md'
                      : 'text-slate-600'
                  }
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-indigo-600 font-medium"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default LandingPageBreadcrumbs;
