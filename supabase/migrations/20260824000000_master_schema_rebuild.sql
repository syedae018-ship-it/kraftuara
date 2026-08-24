-- ========================================================
-- MASTER SCHEMA REBUILD FOR SYMAR LITE
-- Date: 2026-08-24
-- ========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SECURITY & ADMIN DEFINITIONS
-- ============================================================================

-- Only syed.ae018@gmail.com is an admin in production.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (
            raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'role' = 'super_admin'
            OR email = 'syed.ae018@gmail.com'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Check if a user is a store owner or admin. Forward-declared for use in RLS.
CREATE OR REPLACE FUNCTION public.is_store_owner(check_store_id UUID)
RETURNS BOOLEAN SECURITY DEFINER STABLE AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.stores
        WHERE id = check_store_id
        AND (user_id = auth.uid() OR public.is_admin())
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TABLE DEFINITIONS
-- ============================================================================

-- PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- THEMES
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    config_schema JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- STORES (Tenant Root)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    banner_url TEXT,
    theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
    primary_color TEXT DEFAULT '#800020',
    secondary_color TEXT DEFAULT '#111111',
    description TEXT,
    whatsapp TEXT,
    instagram TEXT,
    facebook TEXT,
    email TEXT,
    business_address TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    language TEXT NOT NULL DEFAULT 'en',
    is_published BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'draft', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);

-- STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
    custom_domain TEXT UNIQUE,
    tax_rate NUMERIC(5,2) DEFAULT 0.00,
    shipping_enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_settings_custom_domain ON public.store_settings(custom_domain);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    position INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_store_category_slug UNIQUE (store_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);

-- COLLECTIONS
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    selected_product_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_store_collection_slug UNIQUE (store_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_collections_store_id ON public.collections(store_id);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    compare_at_price NUMERIC(10,2),
    is_published BOOLEAN DEFAULT true,
    inventory_count INT DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_store_product_slug UNIQUE (store_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_store_id ON public.product_images(store_id);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'active',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    razorpay_customer_id TEXT,
    razorpay_subscription_id TEXT,
    razorpay_order_id TEXT,
    razorpay_signature TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_order_id TEXT,
    razorpay_subscription_id TEXT,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RAZORPAY EVENTS
CREATE TABLE IF NOT EXISTS public.razorpay_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CREATIVE ORDERS
CREATE TABLE IF NOT EXISTS public.creative_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    assets_url TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creative_orders_store_id ON public.creative_orders(store_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_store_id ON public.activity_logs(store_id);

-- ANALYTICS DAILY
CREATE TABLE IF NOT EXISTS public.analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    page_views INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    total_sales NUMERIC(12,2) DEFAULT 0.00,
    unique_visitors INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_store_daily_date UNIQUE (store_id, date)
);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_store_id ON public.analytics_daily(store_id);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (store_id, order_number)
);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- STOREFRONT EVENTS
CREATE TABLE IF NOT EXISTS public.storefront_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    session_id TEXT NOT NULL,
    visitor_id TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    page_path TEXT NOT NULL,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    device_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_storefront_events_store_id ON public.storefront_events(store_id);
CREATE INDEX IF NOT EXISTS idx_storefront_events_created_at ON public.storefront_events(created_at);

-- ============================================================================
-- 3. TRIGGERS & AUTO-UPDATES
-- ============================================================================

-- Automatic Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'profiles', 'stores', 'store_settings', 'categories', 'collections', 
        'products', 'subscriptions', 'creative_orders', 'orders', 'payments'
    ]) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
    END LOOP;
END;
$$;

-- ============================================================================
-- 4. ANALYTICS RPCs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_store_analytics_daily(
    p_store_id UUID,
    p_start_date TIMESTAMPTZ
)
RETURNS TABLE (
    event_date DATE,
    page_views BIGINT,
    unique_visitors BIGINT,
    product_views BIGINT,
    add_to_carts BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(created_at) as event_date,
        COUNT(id) FILTER (WHERE event_type = 'page_view') as page_views,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(id) FILTER (WHERE event_type = 'product_view') as product_views,
        COUNT(id) FILTER (WHERE event_type = 'add_to_cart') as add_to_carts
    FROM public.storefront_events
    WHERE store_id = p_store_id AND created_at >= p_start_date
    GROUP BY DATE(created_at)
    ORDER BY event_date ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_store_orders_daily(
    p_store_id UUID,
    p_start_date TIMESTAMPTZ
)
RETURNS TABLE (
    order_date DATE,
    total_orders BIGINT,
    total_revenue NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(created_at) as order_date,
        COUNT(id) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue
    FROM public.orders
    WHERE store_id = p_store_id AND created_at >= p_start_date
    GROUP BY DATE(created_at)
    ORDER BY order_date ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_store_traffic_raw(
    p_store_id UUID,
    p_start_date TIMESTAMPTZ
)
RETURNS TABLE (
    utm_source TEXT,
    referrer TEXT,
    event_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        public.storefront_events.utm_source,
        public.storefront_events.referrer,
        COUNT(id) as event_count
    FROM public.storefront_events
    WHERE store_id = p_store_id AND created_at >= p_start_date AND event_type = 'page_view'
    GROUP BY public.storefront_events.utm_source, public.storefront_events.referrer;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_store_top_products(
    p_store_id UUID,
    p_start_date TIMESTAMPTZ,
    p_limit INT
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    views_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.product_id,
        p.name as product_name,
        COUNT(e.id) as views_count
    FROM public.storefront_events e
    JOIN public.products p ON e.product_id = p.id
    WHERE e.store_id = p_store_id AND e.created_at >= p_start_date AND e.event_type = 'product_view'
    GROUP BY e.product_id, p.name
    ORDER BY views_count DESC
    LIMIT p_limit;
END;
$$;

-- Utility
CREATE OR REPLACE FUNCTION public.safe_cast_uuid(val TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN val::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. INITIAL DATA (SEED)
-- ============================================================================

INSERT INTO public.themes (name, slug, config_schema, is_active)
VALUES
    ('Luxury', 'luxury', '{"primary":"#D4AF37","background":"#0B0B0C","style":"high-end"}'::jsonb, true),
    ('Minimal', 'minimal', '{"primary":"#FFFFFF","background":"#000000","style":"clean"}'::jsonb, true),
    ('Fashion', 'fashion', '{"primary":"#E53E3E","background":"#0F0F10","style":"editorial"}'::jsonb, true),
    ('Dark', 'dark', '{"primary":"#800020","background":"#080808","style":"industrial"}'::jsonb, true),
    ('Elegant', 'elegant', '{"primary":"#C5A880","background":"#0D0E10","style":"serif"}'::jsonb, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    config_schema = EXCLUDED.config_schema,
    is_active = EXCLUDED.is_active;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_events ENABLE ROW LEVEL SECURITY;

-- CLEAR ALL EXISTING POLICIES (to make script idempotent if ran again)
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin());

-- 2. Themes Policies
CREATE POLICY "Public can view active themes" ON public.themes FOR SELECT USING (is_active = true);

-- 3. Stores Policies
CREATE POLICY "Users can view own stores or published stores" ON public.stores
    FOR SELECT USING (user_id = auth.uid() OR is_published = true OR public.is_admin());
CREATE POLICY "Users can insert own stores" ON public.stores
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own stores" ON public.stores
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can delete own stores" ON public.stores
    FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- 4. Store Settings Policies
CREATE POLICY "Store owners can manage settings" ON public.store_settings
    FOR ALL USING (public.is_store_owner(store_id));
CREATE POLICY "Public can view settings of published stores" ON public.store_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.stores WHERE id = store_settings.store_id AND is_published = true)
    );

-- 5. Categories Policies
CREATE POLICY "Store owners can manage categories" ON public.categories FOR ALL USING (public.is_store_owner(store_id));
CREATE POLICY "Public can view categories of published stores" ON public.categories
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.stores WHERE id = categories.store_id AND is_published = true));

-- 6. Collections Policies
CREATE POLICY "Store owners can manage collections" ON public.collections FOR ALL USING (public.is_store_owner(store_id));
CREATE POLICY "Public can view collections of published stores" ON public.collections
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.stores WHERE id = collections.store_id AND is_published = true));

-- 7. Products Policies
CREATE POLICY "Store owners can manage products" ON public.products FOR ALL USING (public.is_store_owner(store_id));
CREATE POLICY "Public can view products of published stores" ON public.products
    FOR SELECT USING (is_published = true AND EXISTS (SELECT 1 FROM public.stores WHERE id = products.store_id AND is_published = true));

-- 8. Product Images Policies
CREATE POLICY "Store owners can manage product images" ON public.product_images FOR ALL USING (public.is_store_owner(store_id));
CREATE POLICY "Public can view images of published stores" ON public.product_images
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.stores WHERE id = product_images.store_id AND is_published = true));

-- 9. Subscriptions Policies
CREATE POLICY "Store owners can manage subscriptions" ON public.subscriptions FOR ALL USING (public.is_store_owner(store_id));

-- 10. Payments & Razorpay
CREATE POLICY "Store owners can manage payments" ON public.payments FOR ALL USING (public.is_store_owner(store_id));
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.is_admin());

-- 11. Creative Orders
CREATE POLICY "Store owners can manage creative orders" ON public.creative_orders FOR ALL USING (public.is_store_owner(store_id));

-- 12. Notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- 13. Activity Logs
CREATE POLICY "Store owners can view activity logs" ON public.activity_logs FOR SELECT USING (public.is_store_owner(store_id));
CREATE POLICY "Store owners can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (public.is_store_owner(store_id));

-- 14. Analytics
CREATE POLICY "Store owners can view analytics" ON public.analytics_daily FOR SELECT USING (public.is_store_owner(store_id));

-- 15. Storefront Events
CREATE POLICY "Public storefront can insert events" ON public.storefront_events FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Store owners can view storefront events" ON public.storefront_events FOR SELECT USING (public.is_store_owner(store_id));

-- 16. Orders
CREATE POLICY "Public storefront can insert orders" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Store owners can view their store orders" ON public.orders FOR SELECT USING (public.is_store_owner(store_id));
CREATE POLICY "Store owners can update their store orders" ON public.orders FOR UPDATE USING (public.is_store_owner(store_id));
CREATE POLICY "Store owners can delete their store orders" ON public.orders FOR DELETE USING (public.is_store_owner(store_id));

-- 17. Order Items
CREATE POLICY "Public storefront can insert order items" ON public.order_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Store owners can view their store order items" ON public.order_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND public.is_store_owner(store_id)));
