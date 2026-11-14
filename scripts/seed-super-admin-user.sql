-- Super Admin (one access): badr.admin@symposai.com
-- Prefer creating via Auth Admin API / Dashboard with role SuperAdmin.
-- If the user already exists, this sets the role metadata.

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "SuperAdmin"}'::jsonb
WHERE email = 'badr.admin@symposai.com';

-- Verify:
-- SELECT id, email, raw_user_meta_data->>'role' AS role FROM auth.users WHERE email = 'badr.admin@symposai.com';
