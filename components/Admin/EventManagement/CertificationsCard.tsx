import React from 'react';
import { Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ViewState } from '../../../types';
import { getRoutePath } from '../../../routes';

const CertificationsCard: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(getRoutePath(ViewState.CERTIFICATE_TEMPLATE_LIST));
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-amber-100 rounded-lg">
          <Award className="w-6 h-6 text-amber-600" />
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Certifications</h3>
      <p className="text-sm text-slate-500">
        Create certificate templates and generate certificates for attendees.
      </p>
    </div>
  );
};

export default CertificationsCard;

