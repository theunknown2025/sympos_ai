import React from 'react';
import { Globe, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ViewState } from '../../../types';
import { getRoutePath } from '../../../routes';

const LandingPageCard: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(getRoutePath(ViewState.LANDING_PAGES));
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Globe className="w-6 h-6 text-indigo-600" />
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Landing Page</h3>
      <p className="text-sm text-slate-500">
        Create and manage your event landing pages with customizable sections and content.
      </p>
    </div>
  );
};

export default LandingPageCard;

