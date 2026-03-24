import os
from supabase import create_client
from dotenv import load_dotenv
import csv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
supabase = create_client(os.environ.get("VITE_SUPABASE_URL"), os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY"))

data = []
with open('../test_enrollments.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        data.append({
            "rollNo": row['Roll No'],
            "name": row[' Name'].strip() if ' Name' in row else row['Name'],
            "email": row[' Email'].strip() if ' Email' in row else row['Email'],
            "department": row[' Department'].strip() if ' Department' in row else row['Department']
        })

dept_names = list(set([d.get('department') for d in data if d.get('department')]))
existing_depts = supabase.table('departments').select('*').in_('name', dept_names).execute()
dept_map = {d['name']: d['id'] for d in existing_depts.data}

all_subjects = supabase.table('subjects').select('id, department_id').execute().data
dept_subjects_map = {}
for s in all_subjects:
    dept_id = s.get('department_id')
    if dept_id:
        if dept_id not in dept_subjects_map:
            dept_subjects_map[dept_id] = []
        dept_subjects_map[dept_id].append(s['id'])
        
rolls = [d.get('rollNo') for d in data if d.get('rollNo')]
existing_stus = supabase.table('students').select('*').in_('roll_no', rolls).execute()
stu_map = {s['roll_no']: s['id'] for s in existing_stus.data}

print(f"Found {len(dept_names)} depts in CSV")
print(f"dept_map keys: {list(dept_map.keys())}")
print(f"dept_subjects_map keys: {list(dept_subjects_map.keys())}")

for d in data[:3]: # check first 3
    stu_id = stu_map.get(d.get('rollNo'))
    dept_id = dept_map.get(d.get('department'))
    print(f"Student {d.get('rollNo')} -> stu_id {stu_id}, csv_dept {d.get('department')}, dept_id {dept_id}")
    dept_subject_ids = dept_subjects_map.get(dept_id, [])
    print(f" -> Found {len(dept_subject_ids)} subjects for dept_id {dept_id}")
