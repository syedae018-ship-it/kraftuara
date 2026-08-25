-- Migration: Add billing and trial fields to subscriptions table
-- To be executed via the SQL Editor on the Supabase dashboard.

ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add comments describing the columns for clarity
COMMENT ON COLUMN public.subscriptions.user_id IS 'Kraftaura merchant user account ID associated with the subscription';
COMMENT ON COLUMN public.subscriptions.trial_start IS 'Timestamp when the free trial period began';
COMMENT ON COLUMN public.subscriptions.trial_end IS 'Timestamp when the free trial period ends';
COMMENT ON COLUMN public.subscriptions.next_billing_date IS 'Timestamp of the next scheduled recurring invoice';
COMMENT ON COLUMN public.subscriptions.amount IS 'Recurring billing amount for the subscription plan';
COMMENT ON COLUMN public.subscriptions.currency IS 'Currency used for billing (default INR)';
