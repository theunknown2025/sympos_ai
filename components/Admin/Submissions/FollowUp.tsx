import React from 'react';
import { Clock, Mail, MessageSquare } from 'lucide-react';

const FollowUp: React.FC = () => {
  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Clock size={32} className="text-indigo-600" />
            Follow Up
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Track and manage follow-up actions for submissions</p>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <Mail size={24} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Email Follow-ups</h2>
            <p className="text-sm text-slate-500">Send reminders and notifications to authors</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <MessageSquare size={24} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Review Follow-ups</h2>
            <p className="text-sm text-slate-500">Track reviewer responses and deadlines</p>
          </div>
        </div>

        <div className="text-center py-12 text-slate-400 border-t border-slate-100 mt-8">
          <Clock size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No follow-up items</p>
          <p className="text-sm">Follow-up content will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default FollowUp;

