-- Create AI Queries Table
CREATE TABLE public.ai_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_queries ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow anonymous and authenticated inserts"
ON public.ai_queries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous and authenticated selects"
ON public.ai_queries
FOR SELECT
USING (true);
