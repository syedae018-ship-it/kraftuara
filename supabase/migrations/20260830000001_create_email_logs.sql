-- MIGRATION: 20260830000001_create_email_logs.sql
-- DESCRIPTION: Audit log and idempotency tracking for customer confirmations and admin notifications

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email_type TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_transaction_email_type UNIQUE (transaction_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_transaction_id ON public.email_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs; users can read their own logs
CREATE POLICY "Admins have full access to email_logs"
    ON public.email_logs
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can view their own email_logs"
    ON public.email_logs
    FOR SELECT
    USING (auth.uid() = user_id);
