-- Create Incidents Table
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location_name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Authenticated users can insert incidents"
ON public.incidents
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() = created_by
);

CREATE POLICY "Authenticated users can view incidents"
ON public.incidents
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can update incidents"
ON public.incidents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
  )
);

