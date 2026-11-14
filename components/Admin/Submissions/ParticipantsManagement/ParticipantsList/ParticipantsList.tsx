import React from 'react';
import { Users } from 'lucide-react';

const ParticipantsList: React.FC = () => {
  return (
    <div className="text-center py-12">
      <Users size={48} className="mx-auto mb-4 text-slate-300" />
      <p className="text-slate-700 font-medium mb-1">Liste Participants</p>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        View and manage all participants registered for your events.
      </p>
    </div>
  );
};

export default ParticipantsList;
