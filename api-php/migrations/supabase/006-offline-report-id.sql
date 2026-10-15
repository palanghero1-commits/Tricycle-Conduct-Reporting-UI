-- Enables idempotent retries for reports queued on a device.
-- Safe to run more than once; existing reports and data are preserved.
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS local_report_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS complaints_local_report_unique
  ON public.complaints (student_user_id, local_report_id);
