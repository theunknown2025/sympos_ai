
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
  sections: {
    id: string;
    type: 'hero' | 'about' | 'speakers' | 'committee' | 'team' | 'agenda' | 'faq' | 'contact' | 'submission' | 'partners' | 'pricing' | 'programAgenda';
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
  type: 'text' | 'field'; // 'text' for static text, 'field' for dynamic field placeholder
  content: string; // Text content or field name (e.g., 'name', 'email')
  x: number; // X position in percentage (0-100)
  y: number; // Y position in percentage (0-100)
  fontSize: number;
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
  CERTIFICATES = 'certificates',
  CERTIFICATE_TEMPLATE_BUILDER = 'certificateTemplateBuilder',
  CERTIFICATE_TEMPLATE_LIST = 'certificateTemplateList',
  GENERATE_CERTIFICATES = 'generateCertificates',
  CANVA_CERTIFICATE_BACKGROUND = 'canvaCertificateBackground',
  PROGRAM_BUILDER = 'programBuilder',
  SETTINGS = 'settings'
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

export interface FormSubmission {
  id: string;
  formId: string;
  eventId: string; // ID of the landing page/event
  eventTitle: string; // Title of the event for easy filtering
  userId: string; // User who created the form
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
  submittedAt: Date;
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
