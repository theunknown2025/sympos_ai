# Project Management Module

This module includes Personnel Management, Projects, and Follow-up features.

## Personnel Management

### Features
- **New Personnel**: Create new personnel members with:
  - Image upload
  - Full Name
  - Phone number
  - Email
  - Role (text field)
  - Role description (optional)
  - Login username
  - Password and confirm password

- **List of Personnel**: View, edit, and delete personnel members

### Database Setup

Run the SQL script to create the personnel table:
```bash
# In Supabase SQL Editor, run:
scripts/create-personnel-table.sql
```

### Authentication Integration

When creating a new personnel member:
1. A new auth user is created with role: `assistant`
2. The personnel record is saved in the `personnel` table
3. The auth user ID is linked to the personnel record

**Note**: Currently using client-side `signUp` which requires email confirmation. For production, create an edge function to use `admin.createUser` for auto-confirmation.

### Edge Function for Production (Recommended)

Create a Supabase Edge Function to handle personnel creation with admin privileges:

```typescript
// supabase/functions/create-personnel/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: requestData } = await req.json();
    const { email, password, fullName, ...personnelData } = requestData;

    // Create auth user with admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'assistant',
        fullName,
      },
    });

    if (authError) {
      throw authError;
    }

    // Create personnel record
    const { data: personnelRecord, error: personnelError } = await supabaseAdmin
      .from('personnel')
      .insert({
        user_id: requestData.userId,
        auth_user_id: authData.user.id,
        ...personnelData,
      })
      .select()
      .single();

    if (personnelError) {
      // Rollback: delete auth user if personnel creation fails
      if (authData.user.id) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      }
      throw personnelError;
    }

    return new Response(
      JSON.stringify({ success: true, data: personnelRecord }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

Then update `personnelService.ts` to call this edge function instead of using `signUp`.

## Projects

Placeholder component for project management functionality.

## Follow Up

Placeholder component for follow-up task management.

