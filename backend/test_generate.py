import requests
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
supabase = create_client(os.environ.get("VITE_SUPABASE_URL"), os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY"))

exams = supabase.table('exam_schedules').select('*').limit(1).execute()
if exams.data:
    exam_id = exams.data[0]['id']
    print(f"Testing generate for exam: {exam_id} - Subject {exams.data[0]['subject_id']}")
    
    res = requests.post("http://127.0.0.1:5000/api/allocations/generate", json={"examScheduleId": exam_id})
    print("Status:", res.status_code)
    print("Response:", res.text)
else:
    print("No exams found.")
