import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

def seed_database():
    print("Clearing existing data...")
    # Clean in reverse dependency order
    supabase.table('seat_allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    supabase.table('student_enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    supabase.table('exam_hall_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    supabase.table('exam_schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    supabase.table('students').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    supabase.table('halls').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    supabase.table('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    supabase.table('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()

    print("Seeding departments...")
    depts = [
        {"name": "Computer Science", "code": "CS"},
        {"name": "Mechanical Engineering", "code": "ME"},
        {"name": "Electronics", "code": "EC"}
    ]
    dept_res = supabase.table('departments').insert(depts).execute()
    dept_map = {d['code']: d['id'] for d in dept_res.data}
    
    print("Seeding subjects...")
    subjects = [
        {"code": "CS601", "name": "Data Structures", "department_id": dept_map["CS"]},
        {"code": "CS602", "name": "Algorithms", "department_id": dept_map["CS"]},
        {"code": "ME601", "name": "Thermodynamics", "department_id": dept_map["ME"]},
        {"code": "EC601", "name": "Signals and Systems", "department_id": dept_map["EC"]}
    ]
    subj_res = supabase.table('subjects').insert(subjects).execute()
    subj_map = {s['code']: s['id'] for s in subj_res.data}

    print("Seeding halls...")
    halls = [
        {"name": "Main Hall A", "building": "Block 1", "rows": 10, "cols": 5, "seats_per_bench": 2, "status": "active", "aisle_after_col": [2]},
        {"name": "Seminar Hall 1", "building": "Block 2", "rows": 8, "cols": 4, "seats_per_bench": 2, "status": "active", "aisle_after_col": [2]}
    ]
    hall_res = supabase.table('halls').insert(halls).execute()
    hall_ids = [h['id'] for h in hall_res.data]
    
    print("Seeding students...")
    students = []
    # 30 CS, 20 ME, 15 EC
    def make_students(prefix, count, dept_id):
        for i in range(1, count + 1):
            students.append({
                "roll_no": f"{prefix}2023{i:03d}",
                "name": f"Student {prefix} {i}",
                "department_id": dept_id
            })
            
    make_students("CS", 30, dept_map["CS"])
    make_students("ME", 20, dept_map["ME"])
    make_students("EC", 15, dept_map["EC"])
    
    stu_res = supabase.table('students').insert(students).execute()
    
    print("Seeding enrollments...")
    enrollments = []
    for stu in stu_res.data:
        roll = stu['roll_no']
        stu_id = stu['id']
        if roll.startswith("CS"):
            enrollments.append({"student_id": stu_id, "subject_id": subj_map["CS601"]})
            enrollments.append({"student_id": stu_id, "subject_id": subj_map["CS602"]})
        elif roll.startswith("ME"):
            enrollments.append({"student_id": stu_id, "subject_id": subj_map["ME601"]})
        elif roll.startswith("EC"):
            enrollments.append({"student_id": stu_id, "subject_id": subj_map["EC601"]})
            
    # Chunk enrollments to avoid large payload errors
    for i in range(0, len(enrollments), 50):
        supabase.table('student_enrollments').insert(enrollments[i:i+50]).execute()

    print("Seeding exam schedules...")
    schedules = [
        {"subject_id": subj_map["CS601"], "date": "2026-04-10", "time": "10:00 AM", "session": "Morning", "allocation_status": "pending"},
        {"subject_id": subj_map["ME601"], "date": "2026-04-10", "time": "10:00 AM", "session": "Morning", "allocation_status": "pending"},
        {"subject_id": subj_map["EC601"], "date": "2026-04-11", "time": "02:00 PM", "session": "Afternoon", "allocation_status": "pending"}
    ]
    sched_res = supabase.table('exam_schedules').insert(schedules).execute()
    
    print("Assigning halls to schedules...")
    assignments = []
    assignments.append({"exam_schedule_id": sched_res.data[0]['id'], "hall_id": hall_ids[0]})
    assignments.append({"exam_schedule_id": sched_res.data[1]['id'], "hall_id": hall_ids[1]})
    
    supabase.table('exam_hall_assignments').insert(assignments).execute()
    
    print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()
