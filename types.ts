
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

/** How a landing-page action button opens (hero, sections, call-for-papers). */
export type SubmissionActionTarget = 'document' | 'link' | 'image' | 'video' | 'form';

/** Form family when actionTarget is form (registration builder vs evaluation builder). */
export type LandingPageFormCategory = 'registration' | 'submission' | 'payment' | 'evaluation';

/** For document/image CTAs: external link vs file uploaded to storage (URL in uploadedFileUrl). */
export type HeroButtonAssetSource = 'url' | 'upload';

export interface HeroButton {
  id: string;
  text: string;
  url: string;
  style: 'primary' | 'secondary';
  formId?: string; // Registration or evaluation form id when actionTarget is form
  /** When actionTarget is form: filter which form list to use. */
  formCategory?: LandingPageFormCategory;
  /** When set, submission section CTA uses this instead of guessing from url/formId. */
  actionTarget?: SubmissionActionTarget;
  /** When actionTarget is document or image: use external url or an uploaded file URL. */
  assetSource?: HeroButtonAssetSource;
  /** Public URL after upload (stored inside landing_pages.config JSON). */
  uploadedFileUrl?: string;
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
  /**
   * When set (e.g. from an imported saved committee), the Scientific Committee section
   * uses a president block for the main committee chair and separate blocks for sub-committees.
   */
  landingTier?: 'president' | 'subcommittee_chair' | 'member';
  /** Field-of-intervention name; groups members with sub-committee chairs on the landing page. */
  subcommitteeName?: string;
}

export type CommitteePersonLinkType = 'orcid' | 'google_scholar' | 'other';

export interface CommitteePersonLink {
  id: string;
  type: CommitteePersonLinkType;
  /** Used when type is `other`. */
  label?: string;
  url: string;
}

export interface ScientificCommitteePerson {
  id: string;
  name: string;
  /** Role / fonction / job title. */
  role: string;
  /** Institution / establishment. */
  establishment: string;
  email: string;
  bio: string;
  imageUrl: string;
  linkedin: string;
  links: CommitteePersonLink[];
}

export interface ScientificSubCommittee {
  id: string;
  name: string;
  icon: EventTopicIcon;
  chair: ScientificCommitteePerson;
  members: ScientificCommitteePerson[];
}

export interface ScientificCommitteeConfig {
  eventChair: ScientificCommitteePerson | null;
  subCommittees: ScientificSubCommittee[];
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

export type EventTopicIcon =
  | 'help'
  | 'calendar'
  | 'credit-card'
  | 'map-pin'
  | 'file-text'
  | 'users'
  | 'cpu'
  | 'brain'
  | 'leaf'
  | 'globe'
  | 'microscope'
  | 'book-open'
  | 'lightbulb'
  | 'network'
  | 'shield'
  | 'zap';

export interface EventTopicItem {
  id: string;
  name: string;
  icon: EventTopicIcon;
  /** Shown on the topic card in the grid. */
  shortDescription: string;
  /** Shown in the detail modal when the visitor clicks the eye icon. */
  longDescription: string;
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

export type TimelineStepIcon =
  | 'calendar'
  | 'file-text'
  | 'send'
  | 'clock'
  | 'check-circle'
  | 'info'
  | 'upload'
  | 'flag'
  | 'award';

export interface TimelineStep {
  id: string;
  title: string;
  /** Shown on the card; max 50 characters (enforced in LP builder editor). */
  description: string;
  /** @deprecated Legacy label; used when deadline is empty. */
  date?: string;
  /** Preferred: ISO YYYY-MM-DD deadline (calendar). */
  deadline?: string;
  icon?: TimelineStepIcon;
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
  /** When true, the price field is unused and the registration form hides payment. */
  isFree?: boolean;
  /** Maximum places. Paid seats are taken on submit; free seats are taken only after approval. */
  capacity?: number;
}

export interface ConferenceConfig {
  title: string;
  date: string;
  location: string;
  description: string;
  header: HeaderConfig;
  hero: HeroConfig;
  speakers: Speaker[];
  /** @deprecated Prefer scientificCommittee — kept for legacy landing pages. */
  committee: CommitteeMember[];
  /** Structured scientific committee (event chair + sub-committees). */
  scientificCommittee?: ScientificCommitteeConfig;
  team: TeamMember[];
  agenda: AgendaDay[];
  faq: FaqItem[];
  eventTopics: EventTopicItem[];
  contact: ContactConfig;
  submission: SubmissionSectionConfig;
  partners: PartnerGroup[];
  pricing: PricingOffer[];
  imageGroups: ImageGroup[];
  sections: {
    id: string;
    type: 'hero' | 'about' | 'speakers' | 'committee' | 'team' | 'agenda' | 'faq' | 'eventTopics' | 'contact' | 'submission' | 'partners' | 'pricing' | 'programAgenda' | 'images';
    title: string;
    content?: string;
    isVisible: boolean;
    titleAlignment?: 'left' | 'center' | 'right';
    programId?: string; // For agenda type - ID of the saved program to download
    showDownloadButton?: boolean; // For agenda type - show/hide download button
    /** Tickets section: one registration form opened by every price-card button. */
    registrationFormId?: string;
    /** Optional CTAs below section content (all section types except hero). */
    actionButtons?: HeroButton[];
    /** @deprecated Migrated to actionButtons — still read for older saved pages */
    showActionButton?: boolean;
    /** @deprecated Migrated to actionButtons */
    actionButton?: HeroButton;
  }[];
  about?: AboutConfig;
}

/** Visual template for the About section. Colors stay on the shared indigo/slate palette. */
export type AboutDesignId = 'classic' | 'stage' | 'editorial';

export interface AboutConfig {
  includeImage: boolean;
  imageUrl: string;
  layout: 'top' | 'left-right' | 'right-left'; // top = image and text on top, left-right = text left image right, right-left = text right image left
  /** Selected About layout template. Missing values render as classic. */
  design?: AboutDesignId;
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
  /** Human-readable label for dynamic fields (builder display). */
  fieldLabel?: string;
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
  /** Organizer home: pick an event to manage or start full workspace */
  ORGANIZER_WORKSPACE = 'organizerWorkspace',
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
  SUBMISSIONS_PARTICIPANTS = 'submissionsParticipants',
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
  PARTICIPANT_CERTIFICATES = 'participantCertificates',
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
  ACADEMY_COURSE_MANAGER = 'academyCourseManager',
  ACADEMY_ENROLLMENT_MANAGER = 'academyEnrollmentManager',
  ACADEMY_PAYMENT_MANAGER = 'academyPaymentManager',
  FILES_MANAGER = 'filesManager',
  EMAILER = 'emailer',
  BLOGS = 'blogs',
  PRESENTER = 'presenter',
  POSTER_MANAGER = 'posterManager',
  SUPERADMIN_DASHBOARD = 'superAdminDashboard',
  SUPERADMIN_PROFILE = 'superAdminProfile',
  SUPERADMIN_ACCOUNTS = 'superAdminAccounts',
  SUPERADMIN_PERFORMANCE = 'superAdminPerformance',
  SUPERADMIN_SECURITY = 'superAdminSecurity',
  SUPERADMIN_SUBSCRIPTIONS = 'superAdminSubscriptions',
  SETTINGS = 'settings',
  PROJECT_MANAGEMENT = 'projectManagement',
  PERSONNEL_MANAGEMENT = 'personnelManagement',
  PROJECTS = 'projects',
  FOLLOW_UP = 'followUp',
  PARTICIPANT_TOOLS = 'participantTools',
  LATEX_EDITOR = 'latexEditor',
  CV_BUILDER = 'cvBuilder',
  PROFILE_BUILDER = 'profileBuilder',
  PARTICIPANT_BLOG = 'participantBlog',
  PARTICIPANT_ACADEMY = 'participantAcademy',
  PARTICIPANT_ACADEMY_COURSES = 'participantAcademyCourses',
  ENTITY_PROFILE = 'entityProfile',
  /** Organizer Account Management — login credentials */
  ACCOUNT_LOGIN = 'accountLogin',
  /** Organizer Account Management — platform packages / offers */
  ACCOUNT_SUBSCRIPTIONS = 'accountSubscriptions',
  /** Organizer Pro checkout (offers + payment proof) */
  ACCOUNT_PRO = 'accountPro',
  PAIEMENT_MANAGEMENT = 'paiementManagement',
  PAIEMENT_INFORMATION = 'paiementInformation',
  NEW_PAIEMENT = 'newPaiement',
  LISTE_OFFERS = 'listeOffers',
  PAIEMENT_FOLLOW_UP = 'paiementFollowUp',
  PAIEMENT_GENERATOR = 'paiementGenerator',
  MESSAGING = 'messaging',
  PARTICIPANT_MESSAGING = 'participantMessaging',
  OPPORTUNITIES_DASHBOARD = 'opportunitiesDashboard',
  OPPORTUNITIES_MANAGE = 'opportunitiesManage',
  OPPORTUNITIES_APPLICATIONS = 'opportunitiesApplications',
  PARTICIPANT_OPPORTUNITIES = 'participantOpportunities',
  PARTICIPANT_OPPORTUNITY_APPLICATIONS = 'participantOpportunityApplications',
  ORGANIZER_MORCHID = 'organizerMorchid',
  PARTICIPANT_MORCHID = 'participantMorchid',
}

export type OpportunityKind = 'job' | 'training' | 'fund';

/** Overlay on image banners (none, dark scrim, or brand gradient). */
export type OpportunityBannerImageOverlay = 'none' | 'dark' | 'gradient';

export interface OpportunityBanner {
  type: 'image' | 'color' | 'gradient';
  imageUrl?: string;
  imagePositionY?: number;
  imageOverlay?: OpportunityBannerImageOverlay;
  color?: string;
  gradientColors?: {
    from: string;
    to: string;
    direction?: 'to-r' | 'to-l' | 'to-b' | 'to-t' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl';
  };
}
export type OpportunityLocationType = 'in_house' | 'remote' | 'hybrid';
export type OpportunityPublishStatus = 'Draft' | 'Published' | 'Closed';
export type OpportunityApplicationStatus = 'in_progress' | 'rejected' | 'completed';

export interface OpportunityComplementaryCriterion {
  name: string;
  value: string;
}

export interface OpportunityAttachedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

export interface OpportunityStep {
  id: string;
  order: number;
  name: string;
  description?: string;
  /** Optional scheduled date (YYYY-MM-DD). */
  date?: string;
  registrationFormId?: string;
}

export interface Opportunity {
  id: string;
  userId: string;
  campusId?: string;
  kind: OpportunityKind;
  title: string;
  banner?: OpportunityBanner;
  attachedFiles: OpportunityAttachedFile[];
  deadline?: string;
  place?: string;
  locationType: OpportunityLocationType;
  complementaryCriteria: OpportunityComplementaryCriterion[];
  description?: string;
  steps: OpportunityStep[];
  /** Custom heading for the process steps block (default: Process steps). */
  stepsSectionTitle?: string;
  paymentFormId?: string;
  paymentStepId?: string;
  publishStatus: OpportunityPublishStatus;
  /** Unique slug for public page (/o/{slug}) when published. */
  publicSlug?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  participantUserId: string;
  currentStepIndex: number;
  status: OpportunityApplicationStatus;
  rejectedAtStepIndex?: number;
  decisionComment?: string;
  decidedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  /** Populated when listing for organizer */
  opportunity?: Opportunity;
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
  | 'url'
  | 'paiement';

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
  selectedOfferId?: string; // For paiement field type - stores the selected payment offer ID
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

/** Stored on `registration_forms.form_category`; drives event payment-form picker and admin grouping. */
export type RegistrationFormCategory = 'registration' | 'submission' | 'payment';

export interface RegistrationForm {
  id: string;
  userId: string;
  title: string;
  /** When set, authoritative category (synced to DB). Title prefixes remain for display compatibility. */
  formCategory?: RegistrationFormCategory;
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
export type SubscriptionRole = 'Organizer' | 'Participant' | 'SuperAdmin' | 'SubSuperAdmin';

export type DecisionStatus = 'accepted' | 'reserved' | 'rejected';
export type DispatchingStatus = 'pending' | 'dispatched' | 'in_review' | 'completed';
export type ApprovalStatus = 'accepted' | 'reserved' | 'rejected';

/** Stages stored on form_submissions for multi-step submission workflows. */
export type SubmissionPipelineKind = 'abstract' | 'article' | 'payment';

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
  /** Multi-step pipeline: abstract vs full article (see event submissionWorkflowPreset). */
  submissionPipelineKind?: SubmissionPipelineKind;
  /** Shared id linking abstract + article rows for one participant flow. */
  submissionPipelineGroupId?: string;
  /** Article row points to abstract submission after abstract is accepted. */
  parentSubmissionId?: string;
  /** On article row: organizer marks payment received (presets B / D). */
  submissionPaymentCompleted?: boolean;
  /** Opportunity application linkage (multi-step job/training/fund flow). */
  opportunityId?: string;
  opportunityApplicationId?: string;
  opportunityStepIndex?: number;
  /** When dispatch assigns reviewers: expected count of completed peer reviews (article pipeline). */
  pipelineReviewersExpected?: number;
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
  /** At most one chair per sub-committee (field); must be one of memberIds when set */
  chairMemberId?: string | null;
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

/** Co-organizer with full event management access. */
export interface EventOrganizerPartner {
  id: string;
  userId: string;
  displayName: string;
  entityLogo?: string;
  representativeEmail?: string;
  createdAt?: Date;
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

/** Submission pipeline preset for an event (New Event wizard). */
export type SubmissionWorkflowPreset = 'A' | 'B' | 'C' | 'D';

/** Registration path: A = registration only; B = registration + payment. */
export type RegistrationWorkflowPreset = 'A' | 'B';

export type EventType = 'Conference' | 'Seminar' | 'Workshop' | 'Webinar' | 'Continuing professional development event' | 'Online conference';
export type EventFormat = 'Virtual' | 'In-Person' | 'Hybrid';

export interface Event {
  id: string;
  userId: string;
  campusId?: string;
  name: string;
  description?: string;
  keywords?: string[]; // Array of keywords
  fields?: string[]; // Array of fields
  subfields?: string[]; // Array of subfields
  eventType?: EventType; // Type of event
  eventFormat?: EventFormat; // Format of event
  partners?: EventPartner[]; // Array of partners
  /** Co-organizer user IDs with full management access. */
  organizerPartnerUserIds?: string[];
  organizerPartners?: EventOrganizerPartner[];
  dates?: EventDate[]; // Array of date ranges
  location?: string;
  links?: EventLink[]; // Array of links
  landingPageIds: string[]; // Array of landing page IDs
  registrationFormIds: string[]; // Array of registration form IDs
  submissionFormIds: string[]; // Array of submission form IDs
  evaluationFormIds: string[]; // Array of evaluation form IDs
  /** @deprecated Prefer registrationCertificateTemplateIds */
  certificateTemplateIds: string[];
  /** @deprecated Prefer submissionBadgeTemplateIds */
  badgeTemplateIds?: string[];
  /** Badge templates for registration / check-in. */
  registrationBadgeTemplateIds?: string[];
  /** Certificate templates for registered attendees. */
  registrationCertificateTemplateIds?: string[];
  /** Badge templates for accepted submissions. */
  submissionBadgeTemplateIds?: string[];
  /** Certificate templates for accepted submissions. */
  submissionCertificateTemplateIds?: string[];
  committeeIds: string[]; // Array of committee IDs
  /** When true, event uses evaluation forms and scientific committees. */
  evaluationEnabled?: boolean;
  banner?: EventBanner; // Banner configuration
  publishStatus?: PublishStatus; // Publication status: Draft, Published, or Closed
  /** Unique slug for public page (/e/{slug}) when published publicly. */
  publicSlug?: string;
  registrationDeadline?: string; // Deadline date for registration (ISO date string)
  submissionDeadline?: string; // Article / full paper submission deadline (ISO date string)
  /** A: article only; B: article + pay; C: abstract + article; D: abstract + article + pay */
  submissionWorkflowPreset?: SubmissionWorkflowPreset;
  abstractSubmissionFormIds?: string[];
  abstractSubmissionDeadline?: string;
  paymentDeadline?: string;
  registrationWorkflowPreset?: RegistrationWorkflowPreset;
  /** payments.id — offer used when registration includes payment (preset B). */
  registrationPaymentOfferId?: string;
  /** payments.id — offer used when submission workflow includes payment (presets B or D). */
  submissionPaymentOfferId?: string;
  /** registration_forms.id — participant payment step form (presets B or D). */
  submissionPaymentFormId?: string;
  /** programs.id — official program shown to participants in the submission timeline when ready. */
  publishedProgramId?: string;
  /** Form field keys shown during registration check-in (registration:{formId}:{fieldId}). */
  registrationCheckinDisplayFieldKeys?: string[];
  /** Form field keys shown during submission presenter check-in (submission:{formId}:{fieldId}). */
  submissionCheckinDisplayFieldKeys?: string[];
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

export type CommitteeInvitationType = 'standard' | 'email' | 'participant';

export interface CommitteeInvitationAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

/** Profile fields stored on an invitation when editing without a committee_members row */
export interface CommitteeInvitationInviteeSnapshot {
  committeeMemberId?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  gender?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  address?: string;
  preferredLanguage?: string;
  affiliation?: ReviewCommitteeMember['affiliation'];
  researchDomains?: string[];
  identifiers?: ReviewCommitteeMember['identifiers'];
  country?: string;
  position?: string;
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
  invitationType: CommitteeInvitationType;
  committeeMemberId?: string;
  emailSubject?: string;
  emailContent?: string;
  attachedFiles?: CommitteeInvitationAttachment[];
  inviteeSnapshot?: CommitteeInvitationInviteeSnapshot;
  sendBatchId?: string;
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
  entityName?: string; // Nom officiel de l'université / institution
  entityCreationDate?: string; // Date de création
  entityLegalStatus?: string; // Statut juridique (publique / privée / fondation / consortium académique)
  entityCountry?: string; // Pays
  entityCity?: string; // Ville
  entityOfficialWebsite?: string; // Site web officiel
  entityEmail?: string; // Email institutionnel
  entityPhone?: string; // Téléphone
  entityAddress?: string;
  entityWebsites?: string[];
  entityLinks?: OrganizerProfileLink[]; // Other links (name and link)
  entityMission?: string; // Mission statement
  entityVision?: string; // Vision statement
  entityScientificDomains?: string[]; // Domaines scientifiques
  // Representative Information
  representativePhoto?: string; // Photo
  representativeFullName?: string; // Full Name
  representativeEmail?: string; // Email
  representativePhone?: string; // Phone number
  representativeFunction?: string; // Function
  // Publishing
  isPublished?: boolean;
  publicSlug?: string;
  publishedUrl?: string;
  // Display Toggles
  showCommittees?: boolean;
  showEvents?: boolean;
  showBlogArticles?: boolean;
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

export type ModificationRoundStatus =
  | 'pending_organizer'
  | 'awaiting_participant'
  | 'participant_submitted'
  | 'reviewer_approved'
  | 'rejected_all';

export type ModificationQuestionOrganizerStatus = 'pending' | 'approved' | 'rejected';

export interface SubmissionModificationQuestion {
  id: string;
  roundId: string;
  sortOrder: number;
  concernedSection: string;
  questionText: string;
  organizerStatus: ModificationQuestionOrganizerStatus;
  organizerDecidedBy?: string;
  organizerDecidedAt?: Date;
  answerText?: string;
  participantAnsweredAt?: Date;
  createdAt: Date;
}

export interface SubmissionModificationFile {
  id: string;
  roundId: string;
  fileUrl: string;
  fileName: string;
  storagePath: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface SubmissionModificationRound {
  id: string;
  submissionId: string;
  reviewerId: string;
  evaluationFormId: string;
  eventId: string;
  roundNumber: number;
  status: ModificationRoundStatus;
  submittedAt?: Date;
  organizerReviewedAt?: Date;
  participantSubmittedAt?: Date;
  reviewerClosedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  questions?: SubmissionModificationQuestion[];
  files?: SubmissionModificationFile[];
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

// ============================================
// ACADEMY LMS TYPES
// ============================================

export type AcademyCourseVisibility = 'public' | 'organization' | 'event';
export type AcademyCourseStatus = 'draft' | 'published' | 'archived';
export type AcademyDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type AcademyLessonContentBlockType = 'text' | 'video' | 'image' | 'link' | 'document' | 'quiz';

export interface AcademyLessonContentBlock {
  id: string;
  lessonId: string;
  blockType: AcademyLessonContentBlockType;
  content: Record<string, unknown>;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademyLesson {
  id: string;
  moduleId: string;
  sectionId?: string;
  title: string;
  orderIndex: number;
  contentType: 'article' | 'video' | 'file' | 'link';
  contentRichText?: any;
  videoUrl?: string;
  attachmentUrls?: string[];
  externalLink?: string;
  hasQuiz: boolean;
  isRequired: boolean;
  estimatedDurationMinutes?: number;
  contentBlocks?: AcademyLessonContentBlock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademySection {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons?: AcademyLesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademyModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isRequired: boolean;
  sections?: AcademySection[];
  lessons?: AcademyLesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademyCourse {
  id: string;
  userId: string;
  organizerProfileId?: string;
  eventId?: string;
  title: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  thumbnailUrl?: string;
  bannerImageUrl?: string;
  difficulty?: AcademyDifficulty;
  estimatedDurationMinutes?: number;
  tags?: string[];
  visibility: AcademyCourseVisibility;
  status: AcademyCourseStatus;
  modules?: AcademyModule[];
  createdAt: Date;
  updatedAt: Date;
}

export type AcademyEnrollmentStatus = 'in_progress' | 'completed' | 'failed' | 'withdrawn';
export type AcademyEnrollmentSource = 'self' | 'assigned' | 'event-auto';

export interface AcademyEnrollment {
  id: string;
  courseId: string;
  participantUserId: string;
  enrollmentSource: AcademyEnrollmentSource;
  status: AcademyEnrollmentStatus;
  finalScore?: number;
  enrolledAt: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademyLessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: Date;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AcademyQuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export interface AcademyQuizOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademyQuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  questionType: AcademyQuestionType;
  orderIndex: number;
  options?: AcademyQuizOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademyQuiz {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  passingScore: number;
  maxAttempts?: number;
  isActive: boolean;
  questions?: AcademyQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademyQuizAttempt {
  id: string;
  quizId: string;
  enrollmentId: string;
  startedAt: Date;
  submittedAt?: Date;
  score?: number;
  passed?: boolean;
  // questionId -> selected option IDs (or boolean for true/false)
  answers?: Record<string, string[] | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademyCertificate {
  id: string;
  courseId: string;
  participantUserId: string;
  certificateTemplateId?: string;
  issuedAt: Date;
  verificationCode?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Presenter Types
export interface PresenterEvent {
  id: string;
  userId: string;
  name: string;
  place?: string;
  date?: Date;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PanelSpeaker {
  name: string;
  title?: string;
  entity?: string;
  picture?: string;
}

export interface PresenterPanel {
  id: string;
  userId: string;
  eventId: string;
  title: string;
  moderatorName?: string;
  moderatorTitle?: string;
  moderatorEntity?: string;
  moderatorPicture?: string;
  speakers: PanelSpeaker[];
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresenterSpeaker {
  id: string;
  userId: string;
  eventId: string;
  name: string;
  title?: string;
  entity?: string;
  picture?: string;
  interventionTitle?: string;
  speakerInfo?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// MESSAGING TYPES
// ============================================

export type MessageGroupMemberType = 'committee_member' | 'registration_participant' | 'submission_participant';
export type MessageSenderType = 'admin' | 'participant';

export interface MessageGroup {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
}

export interface MessageGroupMember {
  id: string;
  groupId: string;
  memberType: MessageGroupMemberType;
  memberId: string;
  memberEmail: string;
  memberName?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  groupId?: string;
  senderId: string;
  senderType: MessageSenderType;
  senderName?: string;
  senderEmail?: string;
  recipientId?: string;
  recipientEmail?: string;
  subject?: string;
  content: string;
  parentMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: MessageAttachment[];
  isRead?: boolean;
  readAt?: Date;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  createdAt: Date;
}

export interface MessageReadStatus {
  id: string;
  messageId: string;
  recipientId?: string;
  recipientEmail?: string;
  readAt: Date;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  email?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  groupId?: string;
  recipientId?: string;
  recipientEmail?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  type: 'committee' | 'participant' | 'group';
  avatar?: string;
}

export interface ParticipantOption {
  id: string;
  email: string;
  name: string;
  type: MessageGroupMemberType;
  sourceId: string; // ID of the source (committee_member.id, form_submission.id, etc.)
}
