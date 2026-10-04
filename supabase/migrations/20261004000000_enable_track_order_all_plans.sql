-- Migration: Enable Customer Order Tracking for All Plans
-- Date: 2026-10-04
-- Rule: Track Order is a universal platform feature available across all plans (₹99, ₹299, ₹499, ₹1499)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saas_plans') THEN
    -- 1. Ensure customer_order_tracking is included in allowed_features for startup plan
    UPDATE public.saas_plans
    SET 
      allowed_features = (
        SELECT jsonb_agg(DISTINCT elem)
        FROM jsonb_array_elements_text(allowed_features || '["customer_order_tracking"]'::jsonb) AS elem
      ),
      features_display = CASE 
        WHEN NOT features_display @> '["Customer Order Status Tracking"]'::jsonb 
        THEN '["Customer Order Status Tracking"]'::jsonb || features_display
        ELSE features_display
      END,
      updated_at = NOW()
    WHERE id = 'startup';

    -- 2. Ensure customer_order_tracking is included in allowed_features for all other plans as well
    UPDATE public.saas_plans
    SET 
      allowed_features = (
        SELECT jsonb_agg(DISTINCT elem)
        FROM jsonb_array_elements_text(allowed_features || '["customer_order_tracking"]'::jsonb) AS elem
      ),
      updated_at = NOW()
    WHERE NOT allowed_features @> '["customer_order_tracking"]'::jsonb;
  END IF;
END $$;
