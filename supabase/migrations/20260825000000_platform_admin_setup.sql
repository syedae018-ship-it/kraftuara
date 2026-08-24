-- Migration: Platform Admin Cleanup & Re-enrollment
-- Date: 2026-08-25
-- Author: Antigravity

DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- 1. Identify the existing auth identity for syed.ae018@gmail.com
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'syed.ae018@gmail.com';
    
    IF v_admin_id IS NOT NULL THEN
        -- 2. Delete the old auth user. This cascades and deletes the profile,
        -- admin's own stores, and admin's own subscriptions without breaking foreign keys.
        DELETE FROM auth.users WHERE id = v_admin_id;
    END IF;
END $$;

-- 3. Ensure RLS is active on the tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
