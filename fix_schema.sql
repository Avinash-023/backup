-- 1. Create the faculty table (missing for Faculty Management module)
CREATE TABLE public.faculty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for faculty
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (since we are currently using basic auth architecture)
CREATE POLICY "Allow public read" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.faculty FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.faculty FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.faculty FOR DELETE USING (true);


-- 2. Update the status constraint on seat_allocations (missing statuses for Exam Day Attendance)
-- We need to drop the old check constraint and add a new one allowing 'present', 'absent', 'malpractice'
ALTER TABLE public.seat_allocations DROP CONSTRAINT seat_allocations_status_check;

ALTER TABLE public.seat_allocations 
  ADD CONSTRAINT seat_allocations_status_check 
  CHECK (status IN ('occupied', 'empty', 'blocked', 'present', 'absent', 'malpractice'));
