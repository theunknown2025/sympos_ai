# Supabase Migration Guide

## ✅ Step 1: Configuration Complete

Supabase has been installed and configured:
- ✅ `@supabase/supabase-js` installed
- ✅ `supabase.ts` created with your credentials
- ✅ `.env.example` created

## 📋 Next Steps

### 1. Update .env file

Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=https://srv1238286.hstgr.cloud
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY3MjExMjA5LCJleHAiOjIwODI1NzEyMDl9.FHXtXhJFtYbgS7EccMf2mt4au5T3M_OhBtn2Dad0gKI
```

**Note:** Vite uses `VITE_` prefix (not `NEXT_PUBLIC_`)

### 2. Create Database Tables in Supabase

Go to: https://app.supabase.com/project/YOUR_PROJECT/editor

Create these tables:

#### `landing_pages`
```sql
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
```

#### `certificate_templates`
```sql
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  background_image TEXT,
  background_image_type TEXT,
  width INTEGER,
  height INTEGER,
  elements TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificate_templates_user_id ON certificate_templates(user_id);
```

#### `committee_members`
```sql
CREATE TABLE committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  committee_member_id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  gender TEXT,
  nationality TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  position TEXT,
  affiliation TEXT, -- JSON string
  preferred_languages TEXT, -- JSON string
  research_domains TEXT, -- JSON string
  links TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_committee_members_user_id ON committee_members(user_id);
CREATE UNIQUE INDEX idx_committee_members_email ON committee_members(email);
CREATE UNIQUE INDEX idx_committee_members_member_id ON committee_members(committee_member_id);
```

#### `registration_forms`
```sql
CREATE TABLE registration_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sections TEXT, -- JSON string
  fields TEXT, -- JSON string
  general_info TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registration_forms_user_id ON registration_forms(user_id);
```

#### `form_submissions`
```sql
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_title TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by TEXT,
  general_info TEXT, -- JSON string
  answers TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX idx_form_submissions_event_id ON form_submissions(event_id);
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
```

### 3. Set Up Row Level Security (RLS)

Enable RLS and create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own landing_pages"
  ON landing_pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own landing_pages"
  ON landing_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landing_pages"
  ON landing_pages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own landing_pages"
  ON landing_pages FOR DELETE
  USING (auth.uid() = user_id);

-- Repeat similar policies for other tables...
```

### 4. Create Storage Buckets

Go to: Storage → Create Bucket

Create these buckets:
- `certificate-templates` (Public: Yes)
- `form-submissions` (Public: No)
- `general` (Public: Yes)

### 5. Migration Status

- ✅ Supabase installed
- ✅ Configuration created
- ⏳ Database tables (need to be created)
- ⏳ RLS policies (need to be created)
- ⏳ Storage buckets (need to be created)
- ⏳ Authentication migration
- ⏳ Service layer migration
- ⏳ Component updates

## 🔄 Migration Order

1. **Database Setup** (SQL above)
2. **Storage Setup** (Buckets)
3. **Authentication** (useAuth, LoginForm, RegisterForm)
4. **Services** (all service files)
5. **Components** (update imports)

## 📚 Supabase Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

