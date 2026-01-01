import React from 'react';
import { Users, FileText } from 'lucide-react';

const CommitteesList: React.FC = () => {
  // TODO: Load committees from service
  const committees: any[] = [];

  if (committees.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Users size={48} className="mx-auto mb-4 opacity-20" />
        <p className="font-medium">No committees</p>
        <p className="text-sm">Create your first committee to get started</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Committees List</h2>
      
      <div className="space-y-4">
        {committees.map((committee) => (
          <div
            key={committee.id}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{committee.name}</h3>
                {committee.description && (
                  <p className="text-sm text-slate-600 mt-1">{committee.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} />
                <span>{committee.memberCount || 0} members</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitteesList;

