import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { PUBLIC_EVENTS_BROWSE_PATH } from './publicEventListingUtils';

const PublicEventsHeader: React.FC = () => {
  const location = useLocation();
  const onBrowse =
    location.pathname === PUBLIC_EVENTS_BROWSE_PATH ||
    location.pathname.startsWith('/e/');

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-slate-900">
          <span className="text-indigo-600">Sympos</span>
          <span>AI</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            to={PUBLIC_EVENTS_BROWSE_PATH}
            className={`inline-flex items-center gap-1.5 ${
              onBrowse ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
            }`}
          >
            <Calendar size={16} />
            Events
          </Link>
          <Link
            to="/login"
            className="text-slate-600 hover:text-indigo-600"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default PublicEventsHeader;
