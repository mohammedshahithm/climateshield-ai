-- Create Alerts Table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location TEXT NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- 1. Everyone can read active or expired alerts
CREATE POLICY "Alerts are viewable by everyone"
ON public.alerts
FOR SELECT
USING (true);

-- 2. Only admins and super_admins can insert alerts
CREATE POLICY "Admins can insert alerts"
ON public.alerts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
  )
);

-- 3. Only admins and super_admins can update alerts
CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
  )
);

-- 4. Only admins and super_admins can delete alerts
CREATE POLICY "Admins can delete alerts"
ON public.alerts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
  )
);
