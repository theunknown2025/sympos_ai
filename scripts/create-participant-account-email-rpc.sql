-- RPC helpers for participant account provisioning (used by server/participantAccountRoutes.js)
-- Run in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.auth_emails_existing(email_list TEXT[])
RETURNS TABLE(email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(u.email::text) AS email
  FROM auth.users u
  WHERE LOWER(u.email) = ANY(
    SELECT LOWER(TRIM(e)) FROM unnest(email_list) AS e WHERE TRIM(e) <> ''
  );
$$;

REVOKE ALL ON FUNCTION public.auth_emails_existing(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_emails_existing(TEXT[]) TO service_role;
