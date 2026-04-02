import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { SubscriptionRole, ViewState } from '../../../types';
import { getRoutePath } from '../../../routes';
import Dashboard from '../Dashboard/Dashboard';
import PageBuilder from '../LPBuilder/Builder/PageBuilder';
import LandingPageManager from '../LPBuilder/Manager/LandingPageManager';
import FormBuilder from '../Tools/FormBuilder/FormBuilder';
import RegistrationsView from '../Registration/RegistrationsView';
import { AcceptedRegistrationList } from '../Registration/CheckinManager';
import SubmissionManager from '../SubmissionManager';
import SubmissionsDashboard from '../Submissions/Dashboard';
import FollowUp from '../Submissions/FollowUp';
import ManageSubmissions from '../Submissions/ManageSubmissions';
import ManageCommittee from '../Submissions/ManageCommittee';
import Reporting from '../Submissions/Reporting';
import CertificateTemplateList from '../Certificates/CertificateTemplateList';
import GenerateCertificates from '../Certificates/GenerateCertificates';
import ViewCertificate from '../Certificates/ViewCertificate';
import CanvaButton from '../Tools/Designer/CanvaButton';
import CampusDashboard from '../SuperAdmin/CampusDashboard';
import SubscriptionManager from '../SuperAdmin/SubscriptionManager';
import ProgramBuilder from '../Submissions/ProgramBuilder/ProgramBuilder';
import FilesManager from '../Tools/FilesManager/FilesManager';
import Emailer from '../Tools/Emailer';
import Blogs from '../Tools/Blogs';
import Presenter from '../Tools/Presenter';
import EventManagement from '../EventManagement/EventManagement';
import EventPreview from '../EventManagement/EventPreview';
import PersonnelManagement from '../ProjectManagement/Personnel/PersonnelManagement';
import Projects from '../ProjectManagement/Projects';
import ProjectFollowUp from '../ProjectManagement/FollowUp';
import JuryDashboard from '../../Participant/Dashboard';
import JuryProfile from '../../Participant/Profile';
import ParticipantProfile from '../../Participant/profile/Profile';
import JuryInvitations from '../../Participant/Invitations';
import JuryEvents from '../../Participant/Events/Events';
import ParticipantEventPreview from '../../Participant/Events/EventPreview';
import ReviewsList from '../../Participant/reviews/ReviewsList';
import ParticipantRegistrations from '../../Participant/Registrations/Registrations';
import ParticipantSubmissions from '../../Participant/Submissions/Submissions';
import LaTeXEditor from '../../Participant/Tools/LaTeXEditor/LaTeXEditor';
import CVBuilder from '../../Participant/Tools/CVBuilder/CVBuilder';
import ProfileBuilder from '../../Participant/Tools/ProfileBuilder/ProfileBuilder';
import ProfilePreviewPage from '../../Participant/Tools/ProfileBuilder/ProfilePreviewPage';
import ParticipantBlogs from '../../Participant/Tools/Blogs/Blogs';
import CoursePlayer from '../../Participant/Academy/CoursePlayer';
import ParticipantCoursesList from '../../Participant/Academy/Courses/CoursesList';
import ParticipantCourseDetail from '../../Participant/Academy/Courses/CourseDetail';
import EntityProfile from '../EntityProfile/EntityProfile';
import PaymentInformation from '../PaiementManagement/PaymentInformation/index';
import NewOffer from '../PaiementManagement/NewOffer/index';
import PaymentFollowUp from '../PaiementManagement/FollowUp';
import PaymentGenerator from '../PaiementManagement/Generator';
import Messaging from '../Messaging/Messaging';
import ParticipantMessaging from '../../Participant/Messaging/Messaging';
import CourseManager from '../Academy/CourseManager';
import EnrollmentManager from '../Academy/EnrollmentManager';
import PaymentManager from '../Academy/PaymentManager';
import CourseFullScreenPage from '../Academy/CourseFullScreenPage';
import { CheckSquare, Settings, GraduationCap } from 'lucide-react';

interface AppRoutesProps {
  isOrganizer: boolean;
  userRole: SubscriptionRole | null;
  onNavigateToView: (viewState: ViewState, routeParams?: Record<string, string>) => void;
  onEditPage: (pageId: string) => void;
  onNewPage: () => void;
  onBackToManager: () => void;
  onEditForm: (formId: string) => void;
  onNewForm: () => void;
  onBackToFormList: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  isOrganizer,
  userRole,
  onNavigateToView,
  onEditPage,
  onNewPage,
  onBackToManager,
  onEditForm,
  onNewForm,
  onBackToFormList,
}) => {
  const params = useParams();
  const editingPageId = params.pageId;
  const editingFormId = params.formId;
  const editingTemplateId = params.templateId;

  return (
    <Routes>
      {/* Root redirect based on role */}
      <Route path="/" element={
        isOrganizer ? (
          <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/dashboard" element={
        isOrganizer ? <Dashboard /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/entity-profile" element={
        isOrganizer ? <EntityProfile /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />

      {/* Organizer-only routes */}
      <Route path="/landing-pages" element={
        isOrganizer ? (
          <LandingPageManager 
            onEdit={onEditPage}
            onNew={onNewPage}
          />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/builder" element={
        isOrganizer ? (
          <PageBuilder 
            pageId={undefined} 
            onBack={onBackToManager}
          />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/builder/:pageId" element={
        isOrganizer ? (
          <PageBuilder 
            pageId={editingPageId} 
            onBack={onBackToManager}
          />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/forms" element={
        isOrganizer ? (
          <FormBuilder 
            formId={undefined}
            onSave={onBackToFormList}
            onEdit={onEditForm}
            onNew={onNewForm}
          />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/forms/:formId" element={
        isOrganizer ? (
          <FormBuilder 
            formId={editingFormId}
            onSave={onBackToFormList}
            onEdit={onEditForm}
            onNew={onNewForm}
          />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/submissions" element={
        isOrganizer ? <SubmissionManager /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/submissions/dashboard" element={
        isOrganizer ? <SubmissionsDashboard /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/submissions/follow-up" element={
        isOrganizer ? <FollowUp /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/submissions/manage" element={
        isOrganizer ? <ManageSubmissions /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/submissions/committee" element={
        isOrganizer ? <ManageCommittee /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/submissions/reporting" element={
        isOrganizer ? <Reporting /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/registrations/list" element={
        isOrganizer ? <RegistrationsView /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/checkin" element={
        isOrganizer ? (
          <div className="p-6">
            <AcceptedRegistrationList />
          </div>
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/certificates/templates" element={
        isOrganizer ? (
          <CertificateTemplateList
            templateId={undefined}
            onEdit={(id) => onNavigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER, { templateId: id })}
            onNew={() => onNavigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER)}
            onSave={() => onNavigateToView(ViewState.CERTIFICATE_TEMPLATE_LIST)}
          />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/certificates/templates/:templateId" element={
        isOrganizer ? (
          <CertificateTemplateList
            templateId={editingTemplateId}
            onEdit={(id) => onNavigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER, { templateId: id })}
            onNew={() => onNavigateToView(ViewState.CERTIFICATE_TEMPLATE_BUILDER)}
            onSave={() => onNavigateToView(ViewState.CERTIFICATE_TEMPLATE_LIST)}
          />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/certificates/generate" element={
        isOrganizer ? <GenerateCertificates /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/certificates/design" element={
        isOrganizer ? (
          <CanvaButton
            onClick={() => {
              // TODO: Open design editor when ready
              console.log('Design editor will open here');
            }}
            onBack={() => onNavigateToView(ViewState.CERTIFICATE_TEMPLATE_LIST)}
          />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      {/* Public certificate viewing route - no auth required */}
      <Route path="/certificate/:certificateId" element={<ViewCertificate />} />
      {/* Public published landing page viewing route - no auth required - handled in App.tsx */}
      <Route path="/submissions/program-builder" element={
        isOrganizer ? <ProgramBuilder /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/files-manager" element={
        isOrganizer ? <FilesManager /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/emailer" element={
        isOrganizer ? <Emailer /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/blogs" element={
        isOrganizer ? <Blogs /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/presenter" element={
        isOrganizer ? <Presenter /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/event-management" element={
        isOrganizer ? <EventManagement /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/event-management/preview/:eventId" element={
        isOrganizer ? <EventPreview /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/academy-lms" element={
        isOrganizer ? (
          <Navigate to={getRoutePath(ViewState.ACADEMY_COURSE_MANAGER)} replace />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/academy-lms/courses" element={
        isOrganizer ? (
          <CourseManager />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/academy-lms/courses/:courseId/preview" element={
        isOrganizer ? (
          <CourseFullScreenPage />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/academy-lms/enrollments" element={
        isOrganizer ? (
          <EnrollmentManager />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/academy-lms/payments" element={
        isOrganizer ? (
          <PaymentManager />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
      <Route path="/project-management/personnel" element={
        isOrganizer ? <PersonnelManagement /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/project-management/projects" element={
        isOrganizer ? <Projects /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/project-management/follow-up" element={
        isOrganizer ? <ProjectFollowUp /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/paiement-management/information" element={
        isOrganizer ? <PaymentInformation /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/paiement-management/new" element={
        isOrganizer ? <NewOffer /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/paiement-management/follow-up" element={
        isOrganizer ? <PaymentFollowUp /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/paiement-management/generator" element={
        isOrganizer ? <PaymentGenerator /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/messaging" element={
        isOrganizer ? <Messaging /> : <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
      } />
      <Route path="/settings" element={
        isOrganizer ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Settings size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium">Settings</p>
            <p className="text-sm">Coming soon...</p>
          </div>
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />

      {/* Jury Member routes - accessible to all authenticated users */}
      <Route path="/jury" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <JuryDashboard />} />
      <Route path="/jury/dashboard" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <JuryDashboard />} />
      <Route path="/jury/profile" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ParticipantProfile />} />
      <Route path="/jury/invitations" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <JuryInvitations />} />
      <Route path="/jury/events" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <JuryEvents />} />
      <Route path="/jury/events/preview/:eventId" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ParticipantEventPreview />} />
      <Route path="/jury/reviews" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ReviewsList />} />
      <Route path="/jury/registrations" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ParticipantRegistrations />} />
      <Route path="/jury/submissions" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ParticipantSubmissions />} />
      <Route path="/jury/tools/latex-editor" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <LaTeXEditor />} />
      <Route path="/jury/tools/cv-builder" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <CVBuilder />} />
      <Route path="/jury/tools/profile-builder" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ProfileBuilder />} />
      <Route path="/jury/tools/profile-builder/preview/:profileId" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ProfilePreviewPage />} />
      <Route path="/jury/tools/blog" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ParticipantBlogs />} />
      <Route path="/jury/messaging" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ParticipantMessaging />} />
      <Route path="/jury/academy" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <Navigate to="/jury/academy/courses" replace />} />
      <Route path="/jury/academy/courses" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ParticipantCoursesList />} />
      <Route path="/jury/academy/courses/:courseId" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <ParticipantCourseDetail />} />
      <Route path="/jury/academy/courses/:courseId/learn" element={isOrganizer ? <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace /> : <CoursePlayer />} />

      {/* Super Admin routes (MVP placeholders) */}
      <Route
        path="/superadmin"
        element={
          userRole === 'SuperAdmin' || userRole === 'SubSuperAdmin' ? (
            <CampusDashboard />
          ) : (
            <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace />
          )
        }
      />
      <Route
        path="/superadmin/subscriptions"
        element={
          userRole === 'SuperAdmin' || userRole === 'SubSuperAdmin' ? (
            <SubscriptionManager />
          ) : (
            <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace />
          )
        }
      />

      {/* Fallback redirect based on role */}
      <Route path="*" element={
        isOrganizer ? (
          <Navigate to={getRoutePath(ViewState.DASHBOARD)} replace />
        ) : (
          <Navigate to={getRoutePath(ViewState.JURY_DASHBOARD)} replace />
        )
      } />
    </Routes>
  );
};

