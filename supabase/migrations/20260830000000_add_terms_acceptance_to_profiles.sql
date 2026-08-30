-- ========================================================
-- ADD TERMS & CONDITIONS ACCEPTANCE TO PROFILES
-- Date: 2026-08-30
-- Version: terms_v1
-- ========================================================

-- 1. Add terms columns to profiles table if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'terms_v1',
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT now();

-- 2. Update handle_new_user() trigger function to persist terms metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        terms_version,
        terms_accepted_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'terms_version', 'terms_v1'),
        COALESCE((NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz, now())
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        terms_version = COALESCE(EXCLUDED.terms_version, public.profiles.terms_version),
        terms_accepted_at = COALESCE(EXCLUDED.terms_accepted_at, public.profiles.terms_accepted_at),
        updated_at = now();
    RETURN NEW;
END;
$$;
