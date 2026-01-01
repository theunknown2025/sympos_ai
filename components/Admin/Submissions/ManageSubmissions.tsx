import React from 'react';
import { FileText, Search, Filter } from 'lucide-react';

const ManageSubmissions: React.FC = () => {
  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText size={32} className="text-indigo-600" />
            Manage Submissions
          </h1>
          <p className="text-slate-500 mt-1 text-sm">View, edit, and manage all paper submissions</p>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search submissions..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No submissions found</p>
          <p className="text-sm">Submission management content will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default ManageSubmissions;

