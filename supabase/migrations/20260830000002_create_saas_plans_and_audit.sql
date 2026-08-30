-- Migration: Create centralized SaaS Plans and Audit Logs table
-- Date: 2026-08-30

CREATE TABLE IF NOT EXISTS public.saas_plans (
  id TEXT PRIMARY KEY, -- 'startup', 'growth', 'pro', 'premium_ai'
  name TEXT NOT NULL,
  price_monthly NUMERIC NOT NULL,
  price_annual NUMERIC NOT NULL,
  description TEXT,
  product_limit INTEGER NOT NULL DEFAULT 12,
  category_limit INTEGER NOT NULL DEFAULT 1,
  allowed_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  features_display JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 1,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  badge TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_trial_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  trial_days INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for public active plans ordering
CREATE INDEX IF NOT EXISTS idx_saas_plans_status_order ON public.saas_plans(status, display_order);

-- Plan Audit Trail table
CREATE TABLE IF NOT EXISTS public.plan_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_audit_logs_plan_id ON public.plan_audit_logs(plan_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active SaaS plans for storefront/pricing/checkout
CREATE POLICY "Allow public read access to saas_plans"
  ON public.saas_plans
  FOR SELECT
  USING (true);

-- Allow service role full access to saas_plans
CREATE POLICY "Allow service role full access to saas_plans"
  ON public.saas_plans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow service role full access to plan_audit_logs
CREATE POLICY "Allow service role full access to plan_audit_logs"
  ON public.plan_audit_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Seed canonical initial plan definitions
INSERT INTO public.saas_plans (
  id, name, price_monthly, price_annual, description, product_limit, category_limit,
  allowed_features, features_display, display_order, is_popular, badge, status, is_trial_eligible, trial_days
) VALUES
(
  'startup',
  'Startup Pack',
  99,
  990,
  'Perfect for new merchants & WhatsApp catalog storefronts.',
  12,
  1,
  '["dashboard", "products", "categories", "store_settings", "appearance", "whatsapp_orders", "shipping"]'::jsonb,
  '["WhatsApp Catalog Order Routing", "Basic Merchant Dashboard", "Product Management (up to 12 products)", "Single Category Catalog Setup", "Dedicated Storefront URL Link", "Kraftaura Classic Theme Template", "Custom Store Logo & Branding"]'::jsonb,
  1,
  FALSE,
  NULL,
  'active',
  FALSE,
  0
),
(
  'growth',
  'Growth Pack',
  299,
  2990,
  'Enhanced growth with Traffic Analytics, Coupons & Multiple Categories.',
  24,
  999999,
  '["dashboard", "products", "categories", "store_settings", "appearance", "whatsapp_orders", "shipping", "analytics", "store_views_analytics", "store_traffic_analytics", "traffic_insights", "creative_discounts", "coupons", "orders", "order_management", "customer_order_tracking"]'::jsonb,
  '["Everything in Startup Pack", "Product Management (up to 24 products)", "Unlimited Category Classifications", "Store Views & Traffic Source Analytics", "Merchant Coupons & Promo Discount Codes", "Customer Order Status Tracking", "Advanced Appearance Customization"]'::jsonb,
  2,
  TRUE,
  'MOST POPULAR',
  'active',
  TRUE,
  3
),
(
  'pro',
  'Pro Plan',
  499,
  4990,
  'Complete E-commerce with Direct Payments, Invoicing & Custom Domains.',
  100,
  999999,
  '["dashboard", "products", "categories", "store_settings", "appearance", "whatsapp_orders", "shipping", "analytics", "store_views_analytics", "store_traffic_analytics", "traffic_insights", "creative_discounts", "coupons", "collections", "orders", "order_management", "customer_order_tracking", "premium_themes", "advanced_themes", "payments", "revenue_dashboard", "inventory", "custom_domain"]'::jsonb,
  '["Everything in Growth Pack", "Product Management (up to 100 products)", "Direct Razorpay Online Payments & Checkout", "Order Management & Customer Invoicing", "Custom Domain Mapping & SSL", "Revenue Analytics & Sales Graphs", "Real-time Inventory & Stock Alerts", "Curated Store Collections", "Premium Designer Store Themes"]'::jsonb,
  3,
  FALSE,
  'FULL E-COMMERCE',
  'active',
  TRUE,
  3
),
(
  'premium_ai',
  'Premium / AI Plan',
  1499,
  14990,
  'VIP growth suite with Pro E-commerce, AI Commercials & 24/7 Dedicated Support.',
  100,
  999999,
  '["dashboard", "products", "categories", "store_settings", "appearance", "whatsapp_orders", "shipping", "analytics", "store_views_analytics", "store_traffic_analytics", "traffic_insights", "creative_discounts", "coupons", "collections", "orders", "order_management", "customer_order_tracking", "premium_themes", "advanced_themes", "payments", "revenue_dashboard", "inventory", "custom_domain", "ai_commercial_reel", "product_mockups", "vip_support_24_7"]'::jsonb,
  '["Everything in Pro Plan", "1 AI Ad Commercial Video Reel", "10 High-Resolution Product Mockups", "24/7 Dedicated Merchant Support", "Custom Domain & Razorpay Payments", "All Pro E-commerce Functionality"]'::jsonb,
  4,
  FALSE,
  'AI SUITE & VIP',
  'active',
  TRUE,
  3
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  description = EXCLUDED.description,
  product_limit = EXCLUDED.product_limit,
  category_limit = EXCLUDED.category_limit,
  allowed_features = EXCLUDED.allowed_features,
  features_display = EXCLUDED.features_display,
  display_order = EXCLUDED.display_order,
  is_popular = EXCLUDED.is_popular,
  badge = EXCLUDED.badge,
  status = EXCLUDED.status,
  is_trial_eligible = EXCLUDED.is_trial_eligible,
  trial_days = EXCLUDED.trial_days,
  updated_at = NOW();
