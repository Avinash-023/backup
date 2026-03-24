import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
supabase = create_client(supabase_url, supabase_key)

try:
    s = supabase.table('students').select('*').execute()
    print("Students Count:", len(s.data))
    
    e = supabase.table('student_enrollments').select('*').execute()
    print("Enrollments Count:", len(e.data))
    
    sub = supabase.table('subjects').select('*').execute()
    print("Subjects Count:", len(sub.data))
    
    # Let's print subjects and their departments to see if there is a mismatch
    departments = supabase.table('departments').select('*').execute()
    print("Departments:", [(d['name'], d['id']) for d in departments.data])
    print("Subjects:", [(s['name'], s['code'], s['department_id']) for s in sub.data])
    
except Exception as e:
    print(e)
