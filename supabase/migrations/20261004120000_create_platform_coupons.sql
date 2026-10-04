-- Migration: Create centralized Platform Coupons (SaaS Promo Codes) Table
-- Date: 2026-10-04

CREATE TABLE IF NOT EXISTS public.platform_coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  applicable_plan_id TEXT NOT NULL DEFAULT 'all', -- 'all', 'startup', 'growth', 'pro', 'premium_ai'
  billing_cycle TEXT NOT NULL DEFAULT 'all' CHECK (billing_cycle IN ('monthly', 'annual', 'all')),
  discount_scope TEXT NOT NULL DEFAULT 'first_payment' CHECK (discount_scope IN ('first_payment', 'entire_period', 'recurring')),
  usage_limit INTEGER NOT NULL DEFAULT 100 CHECK (usage_limit >= 1),
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  expiry_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by promo code
CREATE INDEX IF NOT EXISTS idx_platform_coupons_code ON public.platform_coupons(code);
CREATE INDEX IF NOT EXISTS idx_platform_coupons_status ON public.platform_coupons(status);

-- Enable RLS
ALTER TABLE public.platform_coupons ENABLE ROW LEVEL SECURITY;

-- Allow public read access for server/checkout validation
CREATE POLICY "Allow public read access to platform_coupons"
  ON public.platform_coupons
  FOR SELECT
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to platform_coupons"
  ON public.platform_coupons
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
