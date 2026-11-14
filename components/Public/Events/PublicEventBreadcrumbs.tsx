import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PublicEventBreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Prefixed site home crumb. Pass `null` to omit (e.g. landing-page About flow). */
  siteHome?: { label: string; href: string } | null;
}

const PublicEventBreadcrumbs: React.FC<PublicEventBreadcrumbsProps> = ({
  items,
  siteHome = { label: 'Home', href: '/' },
}) => {
  const crumbs: BreadcrumbItem[] = [
    ...(siteHome ? [{ label: siteHome.label, href: siteHome.href }] : []),
    ...items,
  ];

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600 mb-6">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((item, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight size={14} className="text-slate-400 shrink-0" />}
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

export default PublicEventBreadcrumbs;
