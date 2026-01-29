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
} as const;

