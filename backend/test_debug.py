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

print(f"Loaded {len(data)} rows from CSV")

# 1. Upsert Departments
dept_names = list(set([d.get('department') for d in data if d.get('department')]))
existing_depts = supabase.table('departments').select('*').in_('name', dept_names).execute()
dept_map = {d['name']: d['id'] for d in existing_depts.data}

# 2. Fetch all subjects
all_subjects = supabase.table('subjects').select('id, department_id').execute().data
dept_subjects_map = {}
for s in all_subjects:
    dept_id = s.get('department_id')
    if dept_id:
        if dept_id not in dept_subjects_map:
            dept_subjects_map[dept_id] = []
        dept_subjects_map[dept_id].append(s['id'])
        
# 3. Upsert Students
rolls = [d.get('rollNo') for d in data if d.get('rollNo')]
existing_stus = supabase.table('students').select('*').in_('roll_no', rolls).execute()
stu_map = {s['roll_no']: s['id'] for s in existing_stus.data}

# 4. Upsert Enrollments
existing_enrolls = supabase.table('student_enrollments').select('*').in_('student_id', list(stu_map.values())[:100]).execute() # taking first 100 for test
enroll_set = set([(e['student_id'], e['subject_id']) for e in existing_enrolls.data])

new_enrolls = []
for d in data:
    stu_id = stu_map.get(d.get('rollNo'))
    dept_id = dept_map.get(d.get('department'))
    if stu_id and dept_id:
        dept_subject_ids = dept_subjects_map.get(dept_id, [])
        for sub_id in dept_subject_ids:
            if (stu_id, sub_id) not in enroll_set:
                new_enrolls.append({"student_id": stu_id, "subject_id": sub_id})
                enroll_set.add((stu_id, sub_id))

print(f"Generated {len(new_enrolls)} new enrollments to insert.")
