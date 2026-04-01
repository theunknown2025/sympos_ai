import React from 'react';
import { ProfessorProfile } from '../../../../../services/profileBuilderService';
import AdvancedTemplate from './AdvancedTemplate';
import AdvancedTemplate2 from './AdvancedTemplate2';

interface ProfileTemplateProps {
  profile: ProfessorProfile;
}

const ProfileTemplate: React.FC<ProfileTemplateProps> = ({ profile }) => {
  const template = profile.design?.template || 'default';

  switch (template) {
    case 'advanced':
      return <AdvancedTemplate profile={profile} />;
    case 'advanced2':
      return <AdvancedTemplate2 profile={profile} />;
    case 'default':
    default:
      return null; // Will use the default PublicProfileViewer
  }
};

export default ProfileTemplate;
