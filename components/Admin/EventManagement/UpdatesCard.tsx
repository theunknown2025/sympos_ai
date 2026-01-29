import React from 'react';
import { Bell, ArrowRight } from 'lucide-react';

const UpdatesCard: React.FC = () => {
  const handleClick = () => {
    // TODO: Navigate to updates page when implemented
    console.log('Updates clicked');
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Bell className="w-6 h-6 text-purple-600" />
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Updates</h3>
      <p className="text-sm text-slate-500">
        Manage event announcements, notifications, and updates for participants.
      </p>
    </div>
  );
};

export default UpdatesCard;

