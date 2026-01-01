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
  COMMITTEE_MEMBERS: 'committee_members',
  REGISTRATION_FORMS: 'registration_forms',
  FORM_SUBMISSIONS: 'form_submissions',
  PROGRAMS: 'programs',
} as const;

// Storage bucket names
export const STORAGE_BUCKETS = {
  CERTIFICATE_TEMPLATES: 'certificate-templates',
  FORM_SUBMISSIONS: 'form-submissions',
  GENERAL: 'general',
} as const;

