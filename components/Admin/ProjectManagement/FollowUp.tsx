import React from 'react';
import { Clock } from 'lucide-react';

const FollowUp: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Follow Up</h1>
          <p className="text-slate-500 mt-1">Track and manage follow-up tasks</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center text-slate-400">
          <Clock size={48} className="mb-4 text-slate-300" />
          <p className="text-lg font-medium">Follow Up</p>
          <p className="text-sm">This feature is coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default FollowUp;

