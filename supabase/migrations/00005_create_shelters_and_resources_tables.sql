-- Create Shelters Table
CREATE TABLE public.shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity >= 0),
  occupied INTEGER DEFAULT 0 NOT NULL CHECK (occupied >= 0 AND occupied <= capacity),
  status TEXT DEFAULT 'Available' NOT NULL CHECK (status IN ('Available', 'Full', 'Maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create Resources Table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Ambulance', 'Rescue Team', 'Water Tanker', 'Fire Unit', 'Medical Team', 'Food Supply Unit')),
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status TEXT DEFAULT 'Available' NOT NULL CHECK (status IN ('Available', 'En Route', 'Deployed', 'Maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Select Policies (Everyone can view)
CREATE POLICY "Shelters are viewable by everyone" ON public.shelters
  FOR SELECT USING (true);

CREATE POLICY "Resources are viewable by everyone" ON public.resources
  FOR SELECT USING (true);

-- Insert/Update/Delete Policies (Only admins and super_admins)
CREATE POLICY "Admins can insert shelters" ON public.shelters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
    )
  );

CREATE POLICY "Admins can update shelters" ON public.shelters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
    )
  );

CREATE POLICY "Admins can delete shelters" ON public.shelters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
    )
  );

CREATE POLICY "Admins can insert resources" ON public.resources
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
    )
  );

CREATE POLICY "Admins can update resources" ON public.resources
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
    )
  );

CREATE POLICY "Admins can delete resources" ON public.resources
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
    )
  );

-- Seed Sample Data (if tables are empty)
INSERT INTO public.shelters (name, address, latitude, longitude, capacity, occupied, status)
SELECT 'Chennai Community Shelter', 'Velachery Main Rd', 12.9790, 80.2210, 500, 320, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM public.shelters);

INSERT INTO public.shelters (name, address, latitude, longitude, capacity, occupied, status)
SELECT 'Trichy Relief Center', 'Cantonment, Trichy', 10.8050, 78.6856, 300, 150, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM public.shelters WHERE name = 'Trichy Relief Center');

INSERT INTO public.shelters (name, address, latitude, longitude, capacity, occupied, status)
SELECT 'Kallakurichi Government Shelter', 'Kachirapalayam Rd', 11.7380, 78.9620, 250, 250, 'Full'
WHERE NOT EXISTS (SELECT 1 FROM public.shelters WHERE name = 'Kallakurichi Government Shelter');

INSERT INTO public.shelters (name, address, latitude, longitude, capacity, occupied, status)
SELECT 'Tambaram Emergency Hall', 'Tambaram West', 12.9260, 80.1000, 400, 0, 'Maintenance'
WHERE NOT EXISTS (SELECT 1 FROM public.shelters WHERE name = 'Tambaram Emergency Hall');

-- Seed Resources
INSERT INTO public.resources (name, type, location, latitude, longitude, status)
SELECT 'Ambulance Unit 1', 'Ambulance', 'Velachery Hospital', 12.9780, 80.2230, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM public.resources);

INSERT INTO public.resources (name, type, location, latitude, longitude, status)
SELECT 'Ambulance Unit 2', 'Ambulance', 'Guindy Depot', 13.0067, 80.2206, 'En Route'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Ambulance Unit 2');

INSERT INTO public.resources (name, type, location, latitude, longitude, status)
SELECT 'Rescue Team Alpha', 'Rescue Team', 'Adyar Flyover', 13.0012, 80.2565, 'Deployed'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Rescue Team Alpha');

INSERT INTO public.resources (name, type, location, latitude, longitude, status)
SELECT 'Rescue Team Bravo', 'Rescue Team', 'Tambaram Station', 12.9230, 80.1100, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Rescue Team Bravo');

INSERT INTO public.resources (name, type, location, latitude, longitude, status)
SELECT 'Water Tanker W-01', 'Water Tanker', 'Central Depot', 13.0827, 80.2707, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Water Tanker W-01');

INSERT INTO public.resources (name, type, location, latitude, longitude, status)
SELECT 'Fire Response Unit', 'Fire Unit', 'Anna Nagar', 13.0850, 80.2100, 'Available'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Fire Response Unit');
