-- Alter Resources Table
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_status_check;
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_type_check;

ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1 NOT NULL CHECK (capacity >= 0);
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS contact TEXT DEFAULT '' NOT NULL;

-- Update resources check constraints
ALTER TABLE public.resources ADD CONSTRAINT resources_status_check 
  CHECK (status IN ('Available', 'Deployed', 'Maintenance'));

ALTER TABLE public.resources ADD CONSTRAINT resources_type_check 
  CHECK (type IN ('Ambulance', 'Rescue Team', 'Fire Service', 'Medical Team', 'Relief Camp', 'Water Tanker'));


-- Alter Shelters Table
ALTER TABLE public.shelters DROP CONSTRAINT IF EXISTS shelters_status_check;

ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE public.shelters ADD COLUMN IF NOT EXISTS contact TEXT DEFAULT '' NOT NULL;

-- Update shelters check constraints to Active, Full, Closed
ALTER TABLE public.shelters ADD CONSTRAINT shelters_status_check 
  CHECK (status IN ('Active', 'Full', 'Closed'));

-- Update existing shelter status to match new constraints
UPDATE public.shelters SET status = 'Active' WHERE status = 'Available';
UPDATE public.shelters SET status = 'Closed' WHERE status = 'Maintenance';


-- Extend Incidents Table to support Resource and Rescue Team assignments
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS assigned_resources TEXT[] DEFAULT '{}' NOT NULL;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS assigned_rescue_teams TEXT[] DEFAULT '{}' NOT NULL;
