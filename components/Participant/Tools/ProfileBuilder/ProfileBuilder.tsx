import React from 'react';
import ProfileBuilderEditor from './ProfileBuilderEditor';

const ProfileBuilder: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile Builder</h1>
        <p className="text-slate-600">Create and manage your Professor Profile</p>
      </div>

      <div className="flex-1 min-h-0">
        <ProfileBuilderEditor />
      </div>
    </div>
  );
};

export default ProfileBuilder;
