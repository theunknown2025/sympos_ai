import React from 'react';
import { BarChart3, Download, TrendingUp } from 'lucide-react';

const Reporting: React.FC = () => {
  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BarChart3 size={32} className="text-indigo-600" />
            Reporting
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Generate reports and analytics for submissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Download size={18} />
          Export Report
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <TrendingUp size={20} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Submission Trends</h2>
          </div>
          <div className="text-center py-12 text-slate-400">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Chart will appear here</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BarChart3 size={20} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Status Distribution</h2>
          </div>
          <div className="text-center py-12 text-slate-400">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Chart will appear here</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Detailed Reports</h2>
        <div className="text-center py-12 text-slate-400">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No reports available</p>
          <p className="text-sm">Reporting content will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default Reporting;

