-- Migration: Allow unlinked user subscriptions and payments before store creation, and track onboarding state
-- To be executed via the SQL Editor on the Supabase dashboard.

-- 1. Allow unlinked subscriptions for users who paid before completing store creation
ALTER TABLE public.subscriptions ALTER COLUMN store_id DROP NOT NULL;

-- 2. Ensure each user can have at most one unlinked pending/active subscription at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_unlinked 
  ON public.subscriptions (user_id) 
  WHERE store_id IS NULL;

-- 3. Add user_id to payments table and allow store_id to be NULL
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.payments ALTER COLUMN store_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- 4. Add persistent onboarding status, step, and draft data to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'account_created';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;

-- 5. Update RLS policies so merchants can access their own subscriptions and payments by user_id or store_id
DROP POLICY IF EXISTS "Store owners can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Users and store owners can manage subscriptions" ON public.subscriptions
  FOR ALL USING (
    (user_id = auth.uid()) OR 
    (store_id IS NOT NULL AND public.is_store_owner(store_id))
  );

DROP POLICY IF EXISTS "Store owners can manage payments" ON public.payments;
CREATE POLICY "Users and store owners can manage payments" ON public.payments
  FOR ALL USING (
    (user_id = auth.uid()) OR 
    (store_id IS NOT NULL AND public.is_store_owner(store_id))
  );

-- Admins retain full visibility
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments 
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions 
  FOR SELECT USING (public.is_admin());

COMMENT ON COLUMN public.profiles.onboarding_status IS 'Merchant onboarding lifecycle state (account_created, plan_selected, payment_pending, payment_successful, store_creation_pending, completed)';
COMMENT ON COLUMN public.profiles.onboarding_step IS 'Last active step number in the store creation wizard';
COMMENT ON COLUMN public.profiles.onboarding_data IS 'Persisted draft form state for the store creation wizard';
