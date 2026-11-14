import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Menu, UserPlus, X } from 'lucide-react';
import { getRoutePath } from '../../../routes';
import { ViewState } from '../../../types';

export const PUBLIC_OPPORTUNITIES_BROWSE_PATH = '/opportunities/browse';

const PublicOpportunitiesHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOpportunities =
    location.pathname === PUBLIC_OPPORTUNITIES_BROWSE_PATH ||
    location.pathname.startsWith('/o/');

  const navLinkClass = (active: boolean) =>
    `font-medium transition-colors ${
      active ? 'text-indigo-600' : 'text-slate-700 hover:text-indigo-600'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg sm:text-xl">S</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Symposai
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={navLinkClass(location.pathname === '/')}>
              Home
            </Link>
            <Link
              to={PUBLIC_OPPORTUNITIES_BROWSE_PATH}
              className={navLinkClass(isOpportunities)}
            >
              Opportunities
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(getRoutePath(ViewState.LOGIN))}
                className="px-4 py-2 text-slate-700 hover:text-indigo-600 font-medium flex items-center gap-2"
              >
                <LogIn size={18} />
                Login
              </button>
              <button
                type="button"
                onClick={() => navigate(getRoutePath(ViewState.REGISTER))}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg font-medium flex items-center gap-2"
              >
                <UserPlus size={18} />
                Subscribe
              </button>
            </div>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 text-slate-700"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <Link
            to="/"
            className="block px-4 py-2 rounded-lg text-slate-700 hover:bg-indigo-50"
            onClick={() => setMobileOpen(false)}
          >
            Home
          </Link>
          <Link
            to={PUBLIC_OPPORTUNITIES_BROWSE_PATH}
            className="block px-4 py-2 rounded-lg text-slate-700 hover:bg-indigo-50"
            onClick={() => setMobileOpen(false)}
          >
            Opportunities
          </Link>
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate(getRoutePath(ViewState.LOGIN));
              }}
              className="w-full px-4 py-2.5 text-indigo-600 border-2 border-indigo-600 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate(getRoutePath(ViewState.REGISTER));
              }}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              Subscribe
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicOpportunitiesHeader;
