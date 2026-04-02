import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Note: Using VITE_ prefix for Vite projects (not NEXT_PUBLIC_)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gcgxgtixscwpiiuenlub.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fuxe8Jttg4hrTmlKj5ct5Q_HFzVsUTt';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database table names (will be created in Supabase)
export const TABLES = {
  LANDING_PAGES: 'landing_pages',
  CERTIFICATE_TEMPLATES: 'certificate_templates',
  BADGE_TEMPLATES: 'badge_templates',
  CERTIFICATES: 'certificates',
  COMMITTEE_MEMBERS: 'committee_members',
  COMMITTEES: 'committees',
  REGISTRATION_FORMS: 'registration_forms',
  FORM_SUBMISSIONS: 'form_submissions',
  REGISTRATION_FORMS_ANSWERS: 'registration_forms_answers',
  SUBMISSIONS_ANSWERS: 'submissions_answers',
  PROGRAMS: 'programs',
  EVENTS: 'events',
  JURY_MEMBERS: 'jury_members',
  COMMITTEE_INVITATIONS: 'committee_invitations',
  EVENT_ATTENDANCE: 'event_attendance',
  DISPATCH_SUBMISSIONS: 'dispatch_submissions',
  PERSONNEL: 'personnel',
  PROJECTS: 'projects',
  EMAIL_TEMPLATES: 'email_templates',
  ORGANIZER_PROFILES: 'organizer_profiles',
  PARTICIPANT_PROFILES: 'participant_profiles',
  EVALUATION_FORMS: 'evaluation_forms',
  EVALUATION_ANSWERS: 'evaluation_answers',
  PARTICIPANT_REVIEWS: 'participant_reviews',
  BLOG_ARTICLES: 'blog_articles',
  PARTICIPANTS_BADGE: 'participants_badge',
  REGISTRATION_CHECKIN: 'registration_checkin',
  PRESENTER_EVENTS: 'presenter_events',
  PRESENTER_PANELS: 'presenter_panels',
  PRESENTER_SPEAKERS: 'presenter_speakers',
  PARTICIPANT_SAVED_EVENTS: 'participant_saved_events',
  PARTICIPANT_SHARED_EVENTS: 'participant_shared_events',
  CVS: 'cvs',
  PROFESSOR_PROFILES: 'professor_profiles',
  PAYMENT_METHODS: 'payment_methods',
  PAYMENT_METHOD_FIELDS: 'payment_method_fields',
  PAYMENTS: 'payments',
  PAYMENT_METHOD_SELECTIONS: 'payment_method_selections',
  PAYMENT_COMPONENTS: 'payment_components',
  PAYMENT_TRANSACTIONS: 'payment_transactions',
  PAYMENT_METHOD_FILES: 'payment_method_files',
  MESSAGE_GROUPS: 'message_groups',
  MESSAGE_GROUP_MEMBERS: 'message_group_members',
  MESSAGES: 'messages',
  MESSAGE_ATTACHMENTS: 'message_attachments',
  MESSAGE_READ_STATUS: 'message_read_status',
  CAMPUSES: 'campuses',
  ORGANIZER_MEMBERSHIPS: 'organizer_memberships',
  PARTICIPANT_MEMBERSHIPS: 'participant_memberships',
  SUB_SUPER_ADMIN_MEMBERSHIPS: 'sub_super_admin_memberships',
  ACADEMY_COURSES: 'academy_courses',
  ACADEMY_MODULES: 'academy_modules',
  ACADEMY_SECTIONS: 'academy_sections',
  ACADEMY_LESSONS: 'academy_lessons',
  ACADEMY_LESSON_CONTENT_BLOCKS: 'academy_lesson_content_blocks',
  ACADEMY_SECTION_CONTENT_BLOCKS: 'academy_section_content_blocks',
  ACADEMY_MODULE_CONTENT_BLOCKS: 'academy_module_content_blocks',
  ACADEMY_ENROLLMENTS: 'academy_enrollments',
  ACADEMY_LESSON_PROGRESS: 'academy_lesson_progress',
  ACADEMY_QUIZZES: 'academy_quizzes',
  ACADEMY_QUIZ_QUESTIONS: 'academy_quiz_questions',
  ACADEMY_QUIZ_OPTIONS: 'academy_quiz_options',
  ACADEMY_QUIZ_ATTEMPTS: 'academy_quiz_attempts',
  ACADEMY_CERTIFICATES: 'academy_certificates',
} as const;

// Storage bucket names
export const STORAGE_BUCKETS = {
  CERTIFICATE_TEMPLATES: 'certificate-templates',
  BADGES: 'badges',
  PARTICIPANT_BADGE: 'Participant_Badge', // Bucket for generated participant badges
  FORM_SUBMISSIONS: 'form-submissions',
  GENERAL: 'general',
  SUB_FILES: 'Sub_Files', // Bucket for submission files (papers, documents, etc.)
  DOCUMENTS: 'documents', // Bucket for document files (PDF, DOC, DOCX, etc.)
  MEDIA: 'media', // Bucket for media files (images, videos)
  EMAIL_TEMPLATES: 'email-templates', // Bucket for email template attachments
  EMAIL_ATTACHMENTS: 'email-attachments', // Bucket for email attachment files
  ORGANIZER_PROFILES: 'organizer-profiles', // Bucket for organizer profile images (logos and banners)
  PARTICIPANT_PROFILES: 'participant-profiles', // Bucket for participant profile images
  CV_IMAGES: 'cv-images', // Bucket for CV profile images
  PAYMENT_METHOD_FILES: 'payment-method-files', // Bucket for payment method documents
  MESSAGE_ATTACHMENTS: 'message-attachments', // Bucket for message attachments
  ACADEMY_COURSE_BANNERS: 'academy-course-banners', // Bucket for academy course banners
} as const;

