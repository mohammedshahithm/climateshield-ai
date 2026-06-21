-- Create custom types
CREATE TYPE user_role AS ENUM ('citizen', 'admin', 'super_admin');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'citizen'::user_role NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Climate Alerts table
CREATE TABLE climate_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- Risk Assessments table
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  factors JSONB,
  assessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  assessor_id UUID REFERENCES profiles(id)
);

-- Citizen Reports table
CREATE TABLE citizen_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  location_lat FLOAT,
  location_lng FLOAT,
  status TEXT DEFAULT 'pending' NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  type TEXT NOT NULL
);

-- AI Predictions table
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  prediction_type TEXT NOT NULL,
  probability FLOAT NOT NULL,
  details JSONB,
  predicted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE((new.raw_user_meta_data->>'role')::user_role, 'citizen'::user_role));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Generic policies (to be refined based on exact app needs)
CREATE POLICY "Alerts are viewable by everyone" ON climate_alerts FOR SELECT USING (true);
CREATE POLICY "Admins can insert alerts" ON climate_alerts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Risk assessments are viewable by everyone" ON risk_assessments FOR SELECT USING (true);

CREATE POLICY "Citizen reports viewable by everyone" ON citizen_reports FOR SELECT USING (true);
CREATE POLICY "Citizens can create reports" ON citizen_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Locations are viewable by everyone" ON locations FOR SELECT USING (true);
CREATE POLICY "Predictions are viewable by everyone" ON ai_predictions FOR SELECT USING (true);
