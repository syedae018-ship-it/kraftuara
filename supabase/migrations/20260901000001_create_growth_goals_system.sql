-- ============================================================================
-- Migration: 20260901000001_create_growth_goals_system.sql
-- Description: Complete Merchant Gamification & Growth Goals System (Growth Quest)
-- Available to all SaaS plans, derived strictly from real Supabase orders.
-- ============================================================================

-- 1. MERCHANT GOALS
CREATE TABLE IF NOT EXISTS public.merchant_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('revenue', 'orders_count', 'units_sold', 'avg_order_value', 'selling_streak')),
    target_value NUMERIC(12,2) NOT NULL CHECK (target_value > 0),
    period_type TEXT NOT NULL CHECK (period_type IN ('month', '3_months', '6_months', 'year', 'custom')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'archived')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_goals_store_id ON public.merchant_goals(store_id);
CREATE INDEX IF NOT EXISTS idx_merchant_goals_user_id ON public.merchant_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_goals_status ON public.merchant_goals(status);
CREATE INDEX IF NOT EXISTS idx_merchant_goals_dates ON public.merchant_goals(start_date, end_date);

-- 2. GOAL MILESTONES
CREATE TABLE IF NOT EXISTS public.goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.merchant_goals(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    target_value NUMERIC(12,2) NOT NULL CHECK (target_value > 0),
    label TEXT NOT NULL,
    xp_reward INT NOT NULL DEFAULT 50,
    is_reached BOOLEAN NOT NULL DEFAULT false,
    reached_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON public.goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_store_id ON public.goal_milestones(store_id);

-- 3. MERCHANT GAMIFICATION PROFILE
CREATE TABLE IF NOT EXISTS public.merchant_gamification_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp BIGINT NOT NULL DEFAULT 0,
    level INT NOT NULL DEFAULT 1,
    current_streak_days INT NOT NULL DEFAULT 0,
    longest_streak_days INT NOT NULL DEFAULT 0,
    last_sale_date DATE,
    highest_daily_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    highest_daily_orders INT NOT NULL DEFAULT 0,
    highest_monthly_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    highest_monthly_orders INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_gamification_store_id ON public.merchant_gamification_profile(store_id);

-- 4. MERCHANT ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.merchant_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INT NOT NULL DEFAULT 100,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_store_achievement UNIQUE (store_id, achievement_key)
);
CREATE INDEX IF NOT EXISTS idx_merchant_achievements_store_id ON public.merchant_achievements(store_id);

-- 5. MERCHANT XP LOG
CREATE TABLE IF NOT EXISTS public.merchant_xp_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    source_id TEXT,
    xp_amount INT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_store_xp_event UNIQUE (store_id, source, source_id)
);
CREATE INDEX IF NOT EXISTS idx_merchant_xp_log_store_id ON public.merchant_xp_log(store_id);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.merchant_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_gamification_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_xp_log ENABLE ROW LEVEL SECURITY;

-- Policies for merchant_goals
CREATE POLICY "Users can view own store goals" ON public.merchant_goals
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own store goals" ON public.merchant_goals
    FOR INSERT WITH CHECK (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own store goals" ON public.merchant_goals
    FOR UPDATE USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own store goals" ON public.merchant_goals
    FOR DELETE USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

-- Policies for goal_milestones
CREATE POLICY "Users can view own store milestones" ON public.goal_milestones
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage own store milestones" ON public.goal_milestones
    FOR ALL USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

-- Policies for merchant_gamification_profile
CREATE POLICY "Users can view own gamification profile" ON public.merchant_gamification_profile
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own gamification profile" ON public.merchant_gamification_profile
    FOR ALL USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

-- Policies for merchant_achievements
CREATE POLICY "Users can view own achievements" ON public.merchant_achievements
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage own achievements" ON public.merchant_achievements
    FOR ALL USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

-- Policies for merchant_xp_log
CREATE POLICY "Users can view own xp log" ON public.merchant_xp_log
    FOR SELECT USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can manage own xp log" ON public.merchant_xp_log
    FOR ALL USING (
        store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
    );
