import { commonNs } from './core/common';
import { dashboardNs } from './pages/dashboard';
import { academyNs } from './pages/academy';
import { authNs } from './pages/auth';
import { blogsNs } from './pages/blogs';
import { certificatesNs } from './pages/certificates';
import { emailerNs } from './pages/emailer';
import { entityProfileNs } from './pages/entityProfile';
import { eventManagementNs } from './pages/eventManagement';
import { eventFormNs } from './pages/eventForm';
import { filesManagerNs } from './pages/filesManager';
import { formBuilderNs } from './pages/formBuilder';
import { landingPagesNs } from './pages/landingPages';
import { pageBuilderNs } from './pages/pageBuilder';
import { messagingNs } from './pages/messaging';
import { paiementNs } from './pages/paiement';
import { presenterNs } from './pages/presenter';
import { projectManagementNs } from './pages/projectManagement';
import { registrationNs } from './pages/registration';
import { submissionsNs } from './pages/submissions';
import { superAdminNs } from './pages/superAdmin';
import { participantNs } from './pages/participant';
import { toolsNs } from './pages/tools';
import { designEditorNs } from './pages/designEditor';

/**
 * Single registry for `useAdminTranslation(namespace)`.
 * Add a new page: create `pages/<name>.ts`, import here, and register the key.
 */
export const adminLocaleRegistry = {
  common: commonNs,
  dashboard: dashboardNs,
  academy: academyNs,
  auth: authNs,
  blogs: blogsNs,
  certificates: certificatesNs,
  emailer: emailerNs,
  entityProfile: entityProfileNs,
  eventManagement: eventManagementNs,
  eventForm: eventFormNs,
  filesManager: filesManagerNs,
  formBuilder: formBuilderNs,
  landingPages: landingPagesNs,
  pageBuilder: pageBuilderNs,
  messaging: messagingNs,
  paiement: paiementNs,
  presenter: presenterNs,
  projectManagement: projectManagementNs,
  registration: registrationNs,
  submissions: submissionsNs,
  superAdmin: superAdminNs,
  participant: participantNs,
  tools: toolsNs,
  designEditor: designEditorNs,
} as const;
