-- Migration: Create Merchant Coupons Table & Policies
-- Date: 2026-08-25
-- Author: Antigravity

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL CHECK (code ~ '^[a-zA-Z0-9_-]+$'),
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    value DECIMAL NOT NULL CHECK (value > 0),
    expiry_date TIMESTAMP WITH TIME ZONE,
    usage_limit INT CHECK (usage_limit >= 0),
    usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (store_id, code)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'coupons' AND policyname = 'Store owners can manage their coupons'
    ) THEN
        CREATE POLICY "Store owners can manage their coupons" 
        ON public.coupons 
        FOR ALL 
        USING (public.is_store_owner(store_id));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'coupons' AND policyname = 'Public can read coupons'
    ) THEN
        CREATE POLICY "Public can read coupons" 
        ON public.coupons 
        FOR SELECT 
        TO public 
        USING (status = 'active');
    END IF;
END $$;

-- Add coupon columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00;

