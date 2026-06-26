-- Alter Resources Table type constraint to support the new Phase 11 types
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_type_check;

ALTER TABLE public.resources ADD CONSTRAINT resources_type_check 
  CHECK (type IN (
    'Ambulance', 'Rescue Team', 'Fire Service', 'Medical Team', 'Relief Camp', 'Water Tanker',
    'Food', 'Water', 'Medical Kits', 'Blankets', 'Rescue Boats', 'Hospital', 'Medical Camp'
  ));

-- Seed shelters near Madurai
INSERT INTO public.shelters (name, address, latitude, longitude, capacity, occupied, status, location, contact)
SELECT 'Madurai Central Relief Hall', '22 West Masi Street, Madurai', 9.9252, 78.1198, 350, 120, 'Active', 'Madurai', '+91 452 234 5678'
WHERE NOT EXISTS (SELECT 1 FROM public.shelters WHERE name = 'Madurai Central Relief Hall');

INSERT INTO public.shelters (name, address, latitude, longitude, capacity, occupied, status, location, contact)
SELECT 'Madurai North Safe Shelter', 'Goripalayam Main Rd, Madurai', 9.9360, 78.1280, 200, 190, 'Active', 'Madurai', '+91 452 234 9900'
WHERE NOT EXISTS (SELECT 1 FROM public.shelters WHERE name = 'Madurai North Safe Shelter');

-- Seed shelters near Chennai (Velachery is already in sh-1/seed, but let's make sure there is an active one)
INSERT INTO public.shelters (name, address, latitude, longitude, capacity, occupied, status, location, contact)
SELECT 'Chennai South Shelter Block', 'Adyar Canal Rd, Chennai', 13.0060, 80.2500, 450, 410, 'Active', 'Chennai', '+91 44 2444 8899'
WHERE NOT EXISTS (SELECT 1 FROM public.shelters WHERE name = 'Chennai South Shelter Block');

-- Seed resources near Chennai
INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Chennai Food Pack Unit A', 'Food', 'Guindy Municipal Ground', 13.0070, 80.2210, 'Available', 2000, '+91 94440 11112'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Chennai Food Pack Unit A');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Chennai Emergency Water Tanker 2', 'Water', 'Velachery Depot', 12.9805, 80.2235, 'Available', 15000, '+91 94440 22223'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Chennai Emergency Water Tanker 2');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Chennai Medical Kit Depot', 'Medical Kits', 'Velachery Main Rd', 12.9795, 80.2215, 'Available', 500, '+91 94440 33334'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Chennai Medical Kit Depot');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Chennai Coastal Rescue Boats', 'Rescue Boats', 'Adyar River Depot', 13.0020, 80.2570, 'Available', 12, '+91 94440 44445'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Chennai Coastal Rescue Boats');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Chennai Emergency Blanket Supply', 'Blankets', 'Tambaram West', 12.9265, 80.1010, 'Available', 1000, '+91 94440 55556'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Chennai Emergency Blanket Supply');

-- Seed hospital resources (type = Hospital)
INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Velachery General Hospital', 'Hospital', 'Velachery Road, Chennai', 12.9790, 80.2210, 'Available', 150, '+91 44 2244 0001'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Velachery General Hospital');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Adyar Mission Hospital', 'Hospital', 'Lattice Bridge Rd, Adyar, Chennai', 13.0030, 80.2520, 'Available', 80, '+91 44 2444 0002'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Adyar Mission Hospital');

-- Seed resources near Madurai
INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Madurai Food Distribution Hub', 'Food', 'Goripalayam Main Ground, Madurai', 9.9365, 78.1285, 'Available', 1500, '+91 95550 11111'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Madurai Food Distribution Hub');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Madurai Emergency Water Tanker', 'Water', 'West Masi Depot, Madurai', 9.9255, 78.1205, 'Available', 10000, '+91 95550 22222'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Madurai Emergency Water Tanker');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Madurai Disaster Medical Kits', 'Medical Kits', 'Mission Hospital Rd, Madurai', 9.9285, 78.1235, 'Available', 400, '+91 95550 33333'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Madurai Disaster Medical Kits');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Madurai Rescue Boat Unit', 'Rescue Boats', 'Vaigai River Bank, Madurai', 9.9320, 78.1250, 'Available', 8, '+91 95550 44444'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Madurai Rescue Boat Unit');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Madurai Emergency Ambulance', 'Ambulance', 'Madurai Government Hospital', 9.9250, 78.1190, 'Available', 4, '+91 95550 55555'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Madurai Emergency Ambulance');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Madurai Government Hospital', 'Hospital', 'Goripalayam Rd, Madurai', 9.9355, 78.1275, 'Available', 200, '+91 452 234 1111'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Madurai Government Hospital');

INSERT INTO public.resources (name, type, location, latitude, longitude, status, capacity, contact)
SELECT 'Madurai Medical Camp Vaigai', 'Medical Camp', 'Sellur, Madurai', 9.9400, 78.1220, 'Available', 50, '+91 452 234 2222'
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE name = 'Madurai Medical Camp Vaigai');
