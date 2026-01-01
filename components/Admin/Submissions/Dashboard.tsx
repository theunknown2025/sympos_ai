import React from 'react';
import { LayoutDashboard } from 'lucide-react';

const SubmissionsDashboard: React.FC = () => {
  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <LayoutDashboard size={32} className="text-indigo-600" />
            Submissions Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Overview and statistics of all submissions</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Total Submissions</p>
          <p className="text-3xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Under Review</p>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Accepted</p>
          <p className="text-3xl font-bold text-emerald-600">0</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-2">Pending</p>
          <p className="text-3xl font-bold text-amber-600">0</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
        <div className="text-center py-12 text-slate-400">
          <LayoutDashboard size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No recent activity</p>
          <p className="text-sm">Submissions dashboard content will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsDashboard;

