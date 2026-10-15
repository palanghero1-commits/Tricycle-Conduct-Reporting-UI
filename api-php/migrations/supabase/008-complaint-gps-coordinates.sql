-- Stores GPS coordinates captured with a complaint. Existing reports remain intact.
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS location_accuracy_meters NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMPTZ;
