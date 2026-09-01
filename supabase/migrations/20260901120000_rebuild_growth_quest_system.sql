-- ============================================================================
-- Migration: 20260901120000_rebuild_growth_quest_system.sql
-- Description: Rebuild Growth Quest System - Simple, Practical, Gamified
-- Backed by real Supabase store orders, idempotent point engine, and Super Admin leaderboards.
-- ============================================================================

-- 1. GROWTH QUEST TEMPLATES
CREATE TABLE IF NOT EXISTS public.growth_quest_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'moderate', 'difficult')),
    month_duration INT NOT NULL DEFAULT 1,
    revenue_target NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    orders_target INT NOT NULL DEFAULT 0,
    products_target INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gq_templates_diff ON public.growth_quest_templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_gq_templates_active ON public.growth_quest_templates(is_active);

-- Seed Default Templates
INSERT INTO public.growth_quest_templates (name, description, difficulty, month_duration, revenue_target, orders_target, products_target, is_active, sort_order)
VALUES 
    ('Start Small', 'A realistic, encouraging challenge designed for new or inconsistent sales volume.', 'easy', 1, 3000.00, 5, 5, true, 1),
    ('Build Momentum', 'For merchants who already get regular orders and want to accelerate their monthly sales.', 'moderate', 1, 10000.00, 15, 20, true, 2),
    ('Push Your Month', 'An ambitious challenge to push your products, order count, and monthly revenue higher.', 'difficult', 1, 25000.00, 30, 40, true, 3)
ON CONFLICT DO NOTHING;

-- 2. MERCHANT GROWTH QUESTS
CREATE TABLE IF NOT EXISTS public.growth_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    quest_name TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'custom' CHECK (source_type IN ('custom', 'template')),
    template_id UUID REFERENCES public.growth_quest_templates(id) ON DELETE SET NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'difficult', 'custom')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    revenue_target NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    orders_target INT NOT NULL DEFAULT 0,
    products_target INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'paused', 'archived')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_growth_quests_store_id ON public.growth_quests(store_id);
CREATE INDEX IF NOT EXISTS idx_growth_quests_merchant_id ON public.growth_quests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_growth_quests_status ON public.growth_quests(status);
CREATE INDEX IF NOT EXISTS idx_growth_quests_dates ON public.growth_quests(start_date, end_date);

-- 3. GROWTH QUEST POINTS (Idempotent Ledger)
CREATE TABLE IF NOT EXISTS public.growth_quest_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES public.growth_quests(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('order', 'revenue_progress', 'product_sale', 'milestone', 'quest_completion', 'craftaura_quest')),
    reference_id TEXT NOT NULL,
    points INT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_quest_point_event UNIQUE (store_id, event_type, reference_id)
);
CREATE INDEX IF NOT EXISTS idx_gq_points_store_id ON public.growth_quest_points(store_id);
CREATE INDEX IF NOT EXISTS idx_gq_points_merchant_id ON public.growth_quest_points(merchant_id);
CREATE INDEX IF NOT EXISTS idx_gq_points_event_type ON public.growth_quest_points(event_type);
CREATE INDEX IF NOT EXISTS idx_gq_points_created_at ON public.growth_quest_points(created_at);

-- 4. POINT RULES CONFIGURATION
CREATE TABLE IF NOT EXISTS public.growth_quest_point_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    points_per_order INT NOT NULL DEFAULT 10,
    revenue_unit NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    points_per_revenue_unit INT NOT NULL DEFAULT 1,
    points_per_product_sold INT NOT NULL DEFAULT 2,
    milestone_25_points INT NOT NULL DEFAULT 25,
    milestone_50_points INT NOT NULL DEFAULT 50,
    milestone_75_points INT NOT NULL DEFAULT 75,
    milestone_100_points INT NOT NULL DEFAULT 150,
    craftaura_quest_default_points INT NOT NULL DEFAULT 500,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Single Default Point Rules Row
INSERT INTO public.growth_quest_point_rules (id, points_per_order, revenue_unit, points_per_revenue_unit, points_per_product_sold, milestone_25_points, milestone_50_points, milestone_75_points, milestone_100_points, craftaura_quest_default_points)
VALUES ('00000000-0000-0000-0000-000000000001', 10, 100.00, 1, 2, 25, 50, 75, 150, 500)
ON CONFLICT (id) DO NOTHING;

-- 5. CRAFTAURA MONTHLY QUESTS
CREATE TABLE IF NOT EXISTS public.craftaura_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('orders', 'revenue', 'products')),
    target_value NUMERIC(12,2) NOT NULL,
    points_reward INT NOT NULL DEFAULT 500,
    mystery_reward_description TEXT NOT NULL DEFAULT 'Special Mystery Surprise',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_craftaura_quests_dates ON public.craftaura_quests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_craftaura_quests_active ON public.craftaura_quests(is_active);

-- Seed Initial Craftaura Monthly Challenge
INSERT INTO public.craftaura_quests (name, description, start_date, end_date, target_type, target_value, points_reward, mystery_reward_description, is_active)
VALUES (
    'September Craftaura Challenge',
    'Achieve 15 orders this month to earn 500 Quest Points and unlock the exclusive Mystery Surprise!',
    '2026-09-01 00:00:00+00',
    '2026-09-30 23:59:59+00',
    'orders',
    15,
    500,
    'Special handcrafted gift box & promotion feature on Craftaura home page',
    true
)
ON CONFLICT DO NOTHING;

-- 6. CRAFTAURA QUEST PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.craftaura_quest_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    craftaura_quest_id UUID NOT NULL REFERENCES public.craftaura_quests(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    points_awarded INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_craftaura_participant UNIQUE (craftaura_quest_id, store_id)
);
CREATE INDEX IF NOT EXISTS idx_cq_participants_store ON public.craftaura_quest_participants(store_id);

-- 7. GROWTH QUEST MONTHLY RESULTS (Historical Immutable Snapshot - Super Admin Only)
CREATE TABLE IF NOT EXISTS public.growth_quest_monthly_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    final_points BIGINT NOT NULL DEFAULT 0,
    rank INT NOT NULL,
    is_winner BOOLEAN NOT NULL DEFAULT false,
    reward_status TEXT NOT NULL DEFAULT 'pending' CHECK (reward_status IN ('pending', 'delivered', 'claimed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_monthly_store_result UNIQUE (month, year, store_id)
);
CREATE INDEX IF NOT EXISTS idx_gq_monthly_results_date ON public.growth_quest_monthly_results(year, month);
CREATE INDEX IF NOT EXISTS idx_gq_monthly_results_store ON public.growth_quest_monthly_results(store_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.growth_quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_quest_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_quest_point_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.craftaura_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.craftaura_quest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_quest_monthly_results ENABLE ROW LEVEL SECURITY;

-- 8.1. growth_quest_templates
CREATE POLICY "Public/Merchants can view active templates" ON public.growth_quest_templates
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage templates" ON public.growth_quest_templates
    FOR ALL USING (public.is_admin());

-- 8.2. growth_quests
CREATE POLICY "Users can view own store quests" ON public.growth_quests
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR public.is_admin()
    );

CREATE POLICY "Users can manage own store quests" ON public.growth_quests
    FOR ALL USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR public.is_admin()
    );

-- 8.3. growth_quest_points
CREATE POLICY "Users can view own store points" ON public.growth_quest_points
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR public.is_admin()
    );

CREATE POLICY "Users/Admins can insert store points" ON public.growth_quest_points
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR public.is_admin()
    );

-- 8.4. growth_quest_point_rules
CREATE POLICY "Anyone can view point rules" ON public.growth_quest_point_rules
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage point rules" ON public.growth_quest_point_rules
    FOR ALL USING (public.is_admin());

-- 8.5. craftaura_quests
CREATE POLICY "Anyone can view active craftaura quests" ON public.craftaura_quests
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage craftaura quests" ON public.craftaura_quests
    FOR ALL USING (public.is_admin());

-- 8.6. craftaura_quest_participants
CREATE POLICY "Users can view own participation" ON public.craftaura_quest_participants
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR public.is_admin()
    );

CREATE POLICY "Users can join craftaura quests" ON public.craftaura_quest_participants
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR public.is_admin()
    );

-- 8.7. growth_quest_monthly_results (Super Admin Only access)
CREATE POLICY "Admins can view and manage monthly results" ON public.growth_quest_monthly_results
    FOR ALL USING (public.is_admin());
