import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
supabase = create_client(os.environ.get("VITE_SUPABASE_URL"), os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY"))

# Step 1: Check exam_schedules
exams = supabase.table('exam_schedules').select('*').limit(3).execute()
print("=== Exam Schedules ===")
for e in exams.data:
    print(f"  id={e['id']} subject_id={e['subject_id']} date={e['date']} session={e['session']}")

if not exams.data:
    print("NO EXAM SCHEDULES FOUND"); exit()

target = exams.data[0]
date, time, session = target['date'], target['time'], target['session']
con_exams = supabase.table('exam_schedules').select('*').eq('date', date).eq('time', time).eq('session', session).execute().data
print(f"\n=== Concurrent Exams on {date} {time} {session} ===")
for e in con_exams:
    print(f"  id={e['id']} subject_id={e['subject_id']}")
    # Check enrollments for this subject
    enr = supabase.table('student_enrollments').select('student_id').eq('subject_id', e['subject_id']).execute()
    print(f"    -> Enrollments for subject {e['subject_id']}: {len(enr.data)}")

# Step 2: Check total enrollments 
total_enr = supabase.table('student_enrollments').select('*').execute()
print(f"\n=== Total Enrollments in DB: {len(total_enr.data)} ===")
if total_enr.data:
    unique_subs = set([e['subject_id'] for e in total_enr.data])
    print(f"  Enrolled subjects: {unique_subs}")
