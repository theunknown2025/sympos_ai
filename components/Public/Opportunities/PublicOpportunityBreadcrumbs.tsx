import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PublicOpportunityBreadcrumbsProps {
  items: BreadcrumbItem[];
}

const PublicOpportunityBreadcrumbs: React.FC<PublicOpportunityBreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600 mb-6">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-indigo-600 font-medium">
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              {isLast || !item.href ? (
                <span
                  className={isLast ? 'text-slate-900 font-medium truncate max-w-[14rem] sm:max-w-md' : ''}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="hover:text-indigo-600 font-medium">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default PublicOpportunityBreadcrumbs;
