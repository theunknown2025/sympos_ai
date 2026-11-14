import React from 'react';
import PublicEventsHeader from './PublicEventsHeader';

interface PublicEventsLayoutProps {
  children: React.ReactNode;
}

const PublicEventsLayout: React.FC<PublicEventsLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicEventsHeader />
      <div className="pt-16 sm:pt-20">{children}</div>
    </div>
  );
};

export default PublicEventsLayout;
