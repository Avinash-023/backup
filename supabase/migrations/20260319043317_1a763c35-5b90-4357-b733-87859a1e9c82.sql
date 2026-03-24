-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create halls table
CREATE TABLE public.halls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  rows INTEGER NOT NULL DEFAULT 5,
  cols INTEGER NOT NULL DEFAULT 5,
  seats_per_bench INTEGER NOT NULL DEFAULT 2,
  total_capacity INTEGER GENERATED ALWAYS AS (rows * cols * seats_per_bench) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
  aisle_after_col INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_schedules table
CREATE TABLE public.exam_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('Morning', 'Afternoon')),
  allocation_status TEXT NOT NULL DEFAULT 'pending' CHECK (allocation_status IN ('pending', 'allocated', 'conflict')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_hall_assignments
CREATE TABLE public.exam_hall_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
  hall_id UUID NOT NULL REFERENCES public.halls(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exam_schedule_id, hall_id)
);

-- Create student_enrollments
CREATE TABLE public.student_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

-- Create seat_allocations table
CREATE TABLE public.seat_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
  hall_id UUID NOT NULL REFERENCES public.halls(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  seat_code TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  bench_index INTEGER NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('L', 'R')),
  status TEXT NOT NULL DEFAULT 'occupied' CHECK (status IN ('occupied', 'empty', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exam_schedule_id, hall_id, seat_code)
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_hall_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_allocations ENABLE ROW LEVEL SECURITY;

-- Public read access (will restrict with auth later)
CREATE POLICY "Allow public read" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.halls FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.exam_schedules FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.exam_hall_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.student_enrollments FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.seat_allocations FOR SELECT USING (true);

-- Public write access (will restrict with auth later)
CREATE POLICY "Allow public insert" ON public.halls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.halls FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.halls FOR DELETE USING (true);
CREATE POLICY "Allow public insert" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.exam_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.exam_schedules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.exam_schedules FOR DELETE USING (true);
CREATE POLICY "Allow public insert" ON public.exam_hall_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.exam_hall_assignments FOR DELETE USING (true);
CREATE POLICY "Allow public insert" ON public.student_enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.student_enrollments FOR DELETE USING (true);
CREATE POLICY "Allow public insert" ON public.seat_allocations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.seat_allocations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.seat_allocations FOR DELETE USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_halls_updated_at BEFORE UPDATE ON public.halls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exam_schedules_updated_at BEFORE UPDATE ON public.exam_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_students_roll_no ON public.students(roll_no);
CREATE INDEX idx_students_department ON public.students(department_id);
CREATE INDEX idx_seat_allocations_exam ON public.seat_allocations(exam_schedule_id);
CREATE INDEX idx_seat_allocations_hall ON public.seat_allocations(hall_id);
CREATE INDEX idx_seat_allocations_student ON public.seat_allocations(student_id);
CREATE INDEX idx_exam_schedules_date ON public.exam_schedules(date);
CREATE INDEX idx_student_enrollments_student ON public.student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_subject ON public.student_enrollments(subject_id);