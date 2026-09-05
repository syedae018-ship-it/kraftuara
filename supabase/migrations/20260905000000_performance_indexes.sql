-- ========================================================
-- PERFORMANCE INDEXES MIGRATION FOR MOBILE OPTIMIZATION
-- Date: 2026-09-05
-- ========================================================

-- Subscriptions: Fast lookup by user_id and store_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_user ON public.subscriptions(store_id, user_id);

-- Products: Fast catalog retrieval filtered by store and publication status
CREATE INDEX IF NOT EXISTS idx_products_store_published ON public.products(store_id, is_published);
CREATE INDEX IF NOT EXISTS idx_products_store_category ON public.products(store_id, category_id);

-- Orders: Fast merchant order dashboard loading sorted by recency
CREATE INDEX IF NOT EXISTS idx_orders_store_created ON public.orders(store_id, created_at DESC);

-- Payments: Fast lookup by store_id and payment status
CREATE INDEX IF NOT EXISTS idx_payments_store_status ON public.payments(store_id, status);
