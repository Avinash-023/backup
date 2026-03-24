import requests
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
supabase = create_client(os.environ.get("VITE_SUPABASE_URL"), os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY"))

data = [
    {
        "rollNo": "ENROLL_TEST_1",
        "name": "Enroll Test",
        "email": "enrolltest@example.com",
        "department": "Computer Science"
    }
]

res = requests.post("http://127.0.0.1:5000/api/students/bulk", json=data)
print("Bulk API Status:", res.status_code)

stu = supabase.table('students').select('*').eq('roll_no', 'ENROLL_TEST_1').execute()
print("Student in DB:", len(stu.data) > 0)

if stu.data:
    stu_id = stu.data[0]['id']
    enr = supabase.table('student_enrollments').select('*').eq('student_id', stu_id).execute()
    print("Enrollments for student:", len(enr.data))
    
    # Simulate generate_allocation's query
    if enr.data:
        sub_id = enr.data[0]['subject_id']
        join_res = supabase.table('student_enrollments').select('students(*, departments(*))').eq('subject_id', sub_id).execute()
        print(f"Join Query Result size: {len(join_res.data)}")
        if join_res.data:
            print("First item:", join_res.data[0])

    # Clean up
    supabase.table('student_enrollments').delete().eq('student_id', stu_id).execute()
    supabase.table('students').delete().eq('id', stu_id).execute()
