import React from 'react';
import PublicOpportunitiesHeader from './PublicOpportunitiesHeader';

interface PublicOpportunitiesLayoutProps {
  children: React.ReactNode;
}

const PublicOpportunitiesLayout: React.FC<PublicOpportunitiesLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicOpportunitiesHeader />
      <div className="pt-16 sm:pt-20">{children}</div>
    </div>
  );
};

export default PublicOpportunitiesLayout;
