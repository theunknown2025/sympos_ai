
export enum SubmissionStatus {
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'Under Review',
  ACCEPTED = 'Accepted',
  REVISION_REQUIRED = 'Revision Required',
  REJECTED = 'Rejected'
}

export interface Submission {
  id: string;
  title: string;
  author: string;
  institution: string;
  abstract: string;
  track: string;
  status: SubmissionStatus;
  submittedDate: string;
  files: string[];
}

export interface HeroButton {
  id: string;
  text: string;
  url: string;
  style: 'primary' | 'secondary';
  formId?: string; // Optional: ID of the registration form to show in modal
}

export interface HeroConfig {
  backgroundImage: string;
  showTimer: boolean;
  overlayOpacity: number;
  buttons: HeroButton[];
  layout: 'center' | 'left';
  tagline: string;
  showDate: boolean;
  showLocation: boolean;
}

export interface SocialLink {
  id: string;
  platform: 'linkedin' | 'twitter' | 'website' | 'facebook' | 'instagram' | 'github' | 'youtube';
  url: string;
}

export interface Speaker {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  socials: SocialLink[];
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string; // e.g. "Chair", "Co-Chair", "Member"
  affiliation: string; // e.g. "University of Oxford"
  bio: string;
  imageUrl: string;
  socials: SocialLink[];
}

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  function: string; // Role/Function
  bio: string;
  imageUrl: string;
  links: SocialLink[];
}

export interface AgendaItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  speakerId?: string; // Links to a Speaker.id
  location?: string;
}

export interface AgendaDay {
  id: string;
  date: string;
  label: string; // e.g., "Day 1"
  items: AgendaItem[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  icon: 'help' | 'calendar' | 'credit-card' | 'map-pin' | 'file-text' | 'users';
}

export interface ContactConfig {
  showForm: boolean;
  showMap: boolean;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  mapEmbedUrl: string;
}

export interface TimelineStep {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface SubmissionSectionConfig {
  steps: TimelineStep[];
  buttons: HeroButton[];
}

export interface HeaderConfig {
  showLogo: boolean;
  showTitle: boolean;
  showActionButton: boolean;
  actionButtonText: string;
  actionButtonUrl: string;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  link?: string;
}

export interface PartnerGroup {
  id: string;
  name: string;
  partners: Partner[];
  displayStyle: 'grid' | 'marquee-left' | 'marquee-right';
  showActionButton?: boolean;
  actionButtonText?: string;
  actionButtonUrl?: string;
}

export interface Image {
  id: string;
  url: string;
  alt?: string;
}

export interface ImageGroup {
  id: string;
  name: string;
  images: Image[];
  format: 'catalogue1' | 'catalogue2' | 'catalogue3' | 'catalogue4' | 'slider-rtl' | 'slider-ltr';
  showNavigation: boolean;
  // Optional main image dimensions in pixels (used for catalogue layouts)
  mainWidth?: number;
  mainHeight?: number;
}

export interface PricingOffer {
  id: string;
  name: string;
  price: string;
  currency: string;
  features: string[];
  buttonText: string;
  buttonUrl: string;
  isSoldOut: boolean;
  isHighlighted: boolean;
}

export interface ConferenceConfig {
  title: string;
  date: string;
  location: string;
  description: string;
  header: HeaderConfig;
  hero: HeroConfig;
  speakers: Speaker[];
  committee: CommitteeMember[];
  team: TeamMember[];
  agenda: AgendaDay[];
  faq: FaqItem[];
  contact: ContactConfig;
  submission: SubmissionSectionConfig;
  partners: PartnerGroup[];
  pricing: PricingOffer[];
  imageGroups: ImageGroup[];
  sections: {
    id: string;
    type: 'hero' | 'about' | 'speakers' | 'committee' | 'team' | 'agenda' | 'faq' | 'contact' | 'submission' | 'partners' | 'pricing' | 'programAgenda' | 'images';
    title: string;
    content?: string;
    isVisible: boolean;
    titleAlignment?: 'left' | 'center' | 'right';
    programId?: string; // For agenda type - ID of the saved program to download
    showDownloadButton?: boolean; // For agenda type - show/hide download button
  }[];
  about?: AboutConfig;
}

export interface AboutConfig {
  includeImage: boolean;
  imageUrl: string;
  layout: 'top' | 'left-right' | 'right-left'; // top = image and text on top, left-right = text left image right, right-left = text right image left
}

export interface CertificateTextElement {
  id: string;
  type: 'text' | 'field' | 'qr'; // 'text' for static text, 'field' for dynamic field placeholder, 'qr' for QR code
  content: string; // Text content or field name (e.g., 'name', 'email') - for QR, this is the URL or will be auto-generated
  x: number; // X position in percentage (0-100)
  y: number; // Y position in percentage (0-100)
  fontSize: number; // For QR, this is the size in pixels
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | 'semibold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  rotation?: number; // Rotation in degrees
}

export interface CertificateTemplate {
  id: string;
  userId: string;
  title: string;
  backgroundImage: string; // URL or base64
  backgroundImageType: 'url' | 'upload'; // How the image was added
  width: number; // Template width in pixels
  height: number; // Template height in pixels
  elements: CertificateTextElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StatMetric {
  label: string;
  value: string | number;
  change?: string; // e.g. "+12%"
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export enum ViewState {
  LANDING_PAGE = 'landingPage',
  LOGIN = 'login',
  REGISTER = 'register',
  DASHBOARD = 'dashboard',
  BUILDER = 'builder',
  LANDING_PAGES = 'landingPages',
  REGISTRATIONS = 'registrations',
  FORM_BUILDER = 'formBuilder',
  REGISTRATION_LIST = 'registrationList',
  CHECKIN = 'checkin',
  SUBMISSIONS = 'submissions',
  SUBMISSIONS_DASHBOARD = 'submissionsDashboard',
  SUBMISSIONS_FOLLOW_UP = 'submissionsFollowUp',
  SUBMISSIONS_MANAGE = 'submissionsManage',
  SUBMISSIONS_MANAGE_COMMITTEE = 'submissionsManageCommittee',
  SUBMISSIONS_REPORTING = 'submissionsReporting',
  JURY = 'jury',
  JURY_DASHBOARD = 'juryDashboard',
  JURY_PROFILE = 'juryProfile',
  JURY_INVITATIONS = 'juryInvitations',
  JURY_EVENTS = 'juryEvents',
  JURY_REVIEWS = 'juryReviews',
  PARTICIPANT_REGISTRATIONS = 'participantRegistrations',
  PARTICIPANT_SUBMISSIONS = 'participantSubmissions',
  CERTIFICATES = 'certificates',
  CERTIFICATE_TEMPLATE_BUILDER = 'certificateTemplateBuilder',
  CERTIFICATE_TEMPLATE_LIST = 'certificateTemplateList',
  GENERATE_CERTIFICATES = 'generateCertificates',
  CANVA_CERTIFICATE_BACKGROUND = 'canvaCertificateBackground',
  PROGRAM_BUILDER = 'programBuilder',
  EVENT_MANAGEMENT = 'eventManagement',
  EVENT_PMO = 'eventPmo',
  EVENT_PREVIEW = 'eventPreview',
  ORGANIZER_PROFILE = 'organizerProfile',
  ACADEMY_LMS = 'academyLms',
  FILES_MANAGER = 'filesManager',
  EMAILER = 'emailer',
  BLOGS = 'blogs',
  SETTINGS = 'settings',
  PROJECT_MANAGEMENT = 'projectManagement',
  PERSONNEL_MANAGEMENT = 'personnelManagement',
  PROJECTS = 'projects',
  FOLLOW_UP = 'followUp',
  PARTICIPANT_TOOLS = 'participantTools',
  LATEX_EDITOR = 'latexEditor'
}

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'date' 
  | 'file' 
  | 'url';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  multiple?: boolean; // Allow multiple answers to the same question
  useAsFilter?: boolean; // Use this field as a filter column in registrations/submissions views (checkbox and select only)
  hasSubFields?: boolean; // Enable sub-fields for this question (e.g., Name, Phone, Email in one question)
  subFields?: FormField[]; // Sub-fields that appear together (e.g., Name, Phone, Email)
  options?: string[]; // For select, radio, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  helpText?: string;
  order: number;
  sectionId?: string; // Reference to parent section
  subsectionId?: string; // Reference to parent subsection
}

export interface FormSubsection {
  id: string;
  title: string;
  description?: string;
  order: number;
  sectionId: string; // Reference to parent section
  fields: FormField[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  subsections: FormSubsection[];
  fields: FormField[]; // Fields directly in section (not in subsections)
}

export interface RegistrationForm {
  id: string;
  userId: string;
  title: string;
  description?: string;
  sections: FormSection[];
  fields: FormField[]; // Legacy support - fields not in sections
  generalInfo: {
    collectName: boolean;
    collectEmail: boolean;
    collectPhone: boolean;
    collectOrganization: boolean;
    collectAddress: boolean;
  };
  actions?: {
    sendCopyOfAnswers?: boolean; // Send a copy of answers to the submitter
    sendConfirmationEmail?: boolean; // Send a confirmation email to the submitter
  };
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionType = 'self' | 'entity';
export type SubscriptionRole = 'Organizer' | 'Participant';

export type DecisionStatus = 'accepted' | 'reserved' | 'rejected';
export type DispatchingStatus = 'pending' | 'dispatched' | 'in_review' | 'completed';
export type ApprovalStatus = 'accepted' | 'reserved' | 'rejected';

export interface FormSubmission {
  id: string;
  formId: string;
  eventId: string; // ID of the landing page/event
  eventTitle: string; // Title of the event for easy filtering
  userId: string; // User who created the form (organizer)
  participantUserId?: string; // User ID of the participant who submitted the form
  submittedBy?: string; // Email or name of person who submitted
  subscriptionType: SubscriptionType; // Whether subscribing on behalf of self or entity
  entityName?: string; // Name of the entity if subscribing on behalf of entity
  role: SubscriptionRole; // Role: Organizer or Participant
  isJuryMember?: boolean; // Whether the submitter is a jury member
  juryMemberId?: string; // ID of the jury member if applicable
  generalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    address?: string;
  };
  answers: {
    [fieldId: string]: string | string[] | number | Date | File | null; // Field ID to answer mapping
  };
  submittedAt: Date;
  // Acceptance status fields (for ReceivedSubmissions)
  decisionStatus?: DecisionStatus; // Acceptance status: accepted, reserved, or rejected
  decisionComment?: string;
  decisionDate?: Date;
  decidedBy?: string; // User ID who made the decision
  acceptedEventId?: string; // Event ID for which the submission was accepted (used for dispatch filtering)
  // Dispatching status (for DispatchSubmissions)
  dispatchingStatus?: DispatchingStatus; // pending, dispatched, in_review, or completed
  // Approval status (for SubmissionsEvaluation)
  approvalStatus?: ApprovalStatus; // accepted, reserved, or rejected
}

export interface ReviewCommitteeMember {
  id: string;
  userId: string; // User who created this member
  // Personal Identity
  committeeMemberId: string; // Internal unique ID
  firstName: string;
  lastName: string;
  title?: string; // Prof., Dr., Mr., Ms., etc.
  gender?: string;
  nationality?: string;
  // Contact
  email: string; // Unique, mandatory
  phone?: string;
  address?: string;
  preferredLanguage?: string; // EN, FR, AR, etc.
  // Academic & Professional Profile
  affiliation: {
    institution?: string;
    university?: string;
    organization?: string;
    department?: string;
    faculty?: string;
    country?: string;
    position?: string; // Professor, Researcher, PhD Candidate, Industry Expert, etc.
  };
  researchDomains?: string[]; // Free tags/keywords
  identifiers: {
    orcidId?: string;
    googleScholar?: string;
    researchGate?: string;
    otherLinks?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldOfIntervention {
  id: string;
  name: string;
  memberIds: string[]; // Array of ReviewCommitteeMember IDs
}

export interface Committee {
  id: string;
  userId: string;
  name: string;
  description?: string;
  fieldsOfIntervention: FieldOfIntervention[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDate {
  id: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface EventLink {
  id: string;
  name: string;
  url: string;
}

export interface EventPartner {
  id: string;
  name: string;
  entityId?: string; // Optional reference to entity from database
}

export interface EventBanner {
  type: 'image' | 'color' | 'gradient';
  imageUrl?: string;
  imagePositionY?: number; // Vertical position percentage (0-100, default 50 = center)
  color?: string;
  gradientColors?: {
    from: string;
    to: string;
    direction?: 'to-r' | 'to-l' | 'to-b' | 'to-t' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl';
  };
}

export type PublishStatus = 'Draft' | 'Published' | 'Closed';

export interface Event {
  id: string;
  userId: string;
  name: string;
  description?: string;
  keywords?: string[]; // Array of keywords
  fields?: string[]; // Array of fields
  partners?: EventPartner[]; // Array of partners
  dates?: EventDate[]; // Array of date ranges
  location?: string;
  links?: EventLink[]; // Array of links
  landingPageIds: string[]; // Array of landing page IDs
  registrationFormIds: string[]; // Array of registration form IDs
  submissionFormIds: string[]; // Array of submission form IDs
  evaluationFormIds: string[]; // Array of evaluation form IDs
  certificateTemplateIds: string[]; // Array of certificate template IDs
  committeeIds: string[]; // Array of committee IDs
  banner?: EventBanner; // Banner configuration
  publishStatus?: PublishStatus; // Publication status: Draft, Published, or Closed
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  userId: string;
  title: string;
  subject: string;
  body: string; // HTML or plain text email body
  placeholders?: string[]; // Array of available placeholders like ["{{name}}", "{{email}}", etc.]
  attachments?: string[]; // Array of attachment file paths/URLs
  createdAt: Date;
  updatedAt: Date;
}

export interface JuryMember {
  id: string;
  userId: string; // The authenticated user ID (jury member's own account)
  // Personal Identity
  firstName: string;
  lastName: string;
  title?: string; // Prof., Dr., Mr., Ms., etc.
  gender?: string;
  nationality?: string;
  // Contact
  email: string; // Unique, mandatory
  phone?: string;
  address?: string;
  preferredLanguage?: string; // EN, FR, AR, etc.
  // Academic & Professional Profile
  affiliation: {
    institution?: string;
    university?: string;
    organization?: string;
    department?: string;
    faculty?: string;
    country?: string;
    position?: string; // Professor, Researcher, PhD Candidate, Industry Expert, etc.
  };
  researchDomains?: string[]; // Free tags/keywords
  identifiers: {
    orcidId?: string;
    googleScholar?: string;
    researchGate?: string;
    otherLinks?: string[];
  };
  profileCompleted: boolean; // Whether the profile is complete
  createdAt: Date;
  updatedAt: Date;
}

export enum InvitationStatus {
  NOT_INVITED = 'not_invited',
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface CommitteeInvitation {
  id: string;
  juryMemberId: string; // Reference to jury_members table
  juryMemberEmail: string;
  invitedBy: string; // User ID who sent the invitation
  status: InvitationStatus;
  commentary?: string; // Commentary from jury member when accepting/rejecting
  createdAt: Date;
  respondedAt?: Date;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  eventName: string;
  juryMemberId: string;
  juryMemberEmail: string;
  attendanceConfirmed: boolean;
  confirmedAt?: Date;
  createdAt: Date;
}

export interface DispatchSubmission {
  id: string;
  userId: string;
  eventId: string;
  formId: string;
  dispatching: {
    [submissionId: string]: string[]; // submissionId -> array of committee member IDs
  };
  deadline?: Date; // Optional deadline for completing reviews
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizerProfileLink {
  id: string;
  name: string;
  url: string;
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  // Entity Information
  entityLogo?: string;
  entityBanner?: string;
  entityName?: string;
  entityEmail?: string;
  entityPhone?: string;
  entityAddress?: string;
  entityWebsites?: string[];
  entityLinks?: OrganizerProfileLink[];
  // Representative Information
  representativeFullName?: string;
  representativeEmail?: string;
  representativePhone?: string;
  representativeAddress?: string;
  representativeFunction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipantProfileLink {
  id: string;
  name: string;
  url: string;
}

export interface ParticipantProfile {
  id: string;
  userId: string;
  // Personal Information
  profilePicture?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  // Professional Information
  title?: string; // Prof., Dr., Mr., Ms., etc.
  position?: string; // Job title/position
  organization?: string; // Organization/Institution name
  bio?: string; // Biography or description
  // Contact & Links
  website?: string;
  websites?: string[]; // Array of website URLs
  links?: ParticipantProfileLink[]; // Array of link objects
  // Academic Identifiers
  orcidId?: string; // ORCID ID
  googleScholar?: string; // Google Scholar profile URL
  researchGate?: string; // ResearchGate profile URL
  otherLinks?: string[]; // Array of additional academic/research links
  // Additional Information
  country?: string;
  city?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluationForm {
  id: string;
  userId: string;
  title: string;
  description?: string;
  sections: FormSection[];
  fields: FormField[]; // Legacy support - fields not in sections
  generalInfo: {
    collectName: boolean;
    collectEmail: boolean;
    collectPhone: boolean;
    collectOrganization: boolean;
    collectAddress: boolean;
  };
  actions?: {
    sendCopyOfAnswers?: boolean; // Send a copy of answers to the submitter
    sendConfirmationEmail?: boolean; // Send a confirmation email to the submitter
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluationAnswer {
  id: string;
  evaluationFormId: string;
  userId: string;
  submittedBy?: string; // Email or name of person who submitted
  generalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    address?: string;
  };
  answers: {
    [fieldId: string]: string | string[] | number | Date | File | null; // Field ID to answer mapping
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewStatus = 'draft' | 'completed';

export interface ParticipantReview {
  id: string;
  participantId: string; // Committee member ID (from committee_members table)
  userId: string; // Auth user ID of the participant
  eventId: string;
  formId: string; // Evaluation form ID
  submissionId: string; // Submission or evaluation answer ID being reviewed
  submissionType: 'submission' | 'evaluation'; // Type of item being reviewed
  status: ReviewStatus; // Status of the review: 'draft' (saved but not submitted) or 'completed' (submitted)
  answers: {
    [fieldId: string]: string | string[] | number | Date | File | null; // Field ID to answer mapping
  };
  createdAt: Date;
  updatedAt: Date;
}

export type BlogArticleStatus = 'draft' | 'published' | 'archived';

export interface BlogArticle {
  id: string;
  userId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string; // Rich text content (HTML or Markdown)
  featuredImage?: string;
  status: BlogArticleStatus;
  publishedAt?: Date;
  tags?: string[];
  authorName?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}
