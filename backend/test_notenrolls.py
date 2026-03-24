import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
supabase = create_client(os.environ.get("VITE_SUPABASE_URL"), os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY"))

stus = supabase.table('students').select('id, roll_no, department_id').execute()
print(f"Students in DB: {len(stus.data)}")
if stus.data:
    sample = stus.data[:3]
    for s in sample:
        print(f"  roll={s['roll_no']} dept_id={s['department_id']}")
    
    # Check their enrollments
    ids = [s['id'] for s in stus.data[:10]]
    enr = supabase.table('student_enrollments').select('*').in_('student_id', ids).execute()
    print(f"\nEnrollments for first 10 students: {len(enr.data)}")
    
    # Check what subjects exist for their departments
    dept_ids = list(set([s['department_id'] for s in stus.data if s['department_id']]))
    print(f"\nDepartment IDs from students: {dept_ids}")
    subs = supabase.table('subjects').select('id, code, department_id').execute()
    print(f"All subjects in DB:")
    for s in subs.data:
        matched = "✓ MATCHES" if s['department_id'] in dept_ids else "✗ no match"
        print(f"  code={s['code']} dept_id={s['department_id']} {matched}")
