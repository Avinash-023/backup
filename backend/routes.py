from flask import Blueprint, request, jsonify
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from supabase import create_client, Client
import random

api_bp = Blueprint('api', __name__)

supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

try:
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as e:
    supabase = None
    print(f"Error initializing Supabase client in routes: {e}")

def error_res(message, status=400):
    return jsonify({"error": message}), status

def send_allocation_email(student_email, student_name, subject_name, date, time, hall_name, seat_code):
    """
    Sends an email notification to the student about their seat allocation.
    This is configured to print to the console by default. If SMTP credentials 
    are added to the environment, it will send a real email.
    """
    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = os.environ.get("SMTP_PORT", 587)
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    
    body = f"""
    Dear {student_name},
    
    Your seat for the upcoming {subject_name} exam has been allocated.
    
    Date: {date}
    Time: {time}
    Hall: {hall_name}
    Seat Code: {seat_code}
    
    Best of luck!
    Exam Hall Planner System
    """
    
    if smtp_server and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart()
            msg['From'] = smtp_user
            msg['To'] = student_email
            msg['Subject'] = f"Exam Seat Allocation: {subject_name}"
            msg.attach(MIMEText(body, 'plain'))
            server = smtplib.SMTP(smtp_server, int(smtp_port))
            server.starttls()
            server.login(smtp_user, smtp_pass)
            text = msg.as_string()
            server.sendmail(smtp_user, student_email, text)
            server.quit()
        except Exception as e:
            print(f"Failed to send real email to {student_email}: {e}")
    else:
        # Mock sending email
        print(f"--- MOCK EMAIL ---")
        print(f"To: {student_email}")
        print(f"Subject: Exam Seat Allocation: {subject_name}")
        print(body)
        print(f"------------------")

# --- HALLS MANAGEMENT ---

@api_bp.route('/halls', methods=['GET'])
def get_halls():
    if not supabase: return error_res("Supabase not configured", 500)
    response = supabase.table('halls').select('*').execute()
    halls = []
    for h in response.data:
        halls.append({
            "id": h["id"],
            "name": h["name"],
            "building": h["building"],
            "rows": h["rows"],
            "cols": h["cols"],
            "seatsPerBench": h["seats_per_bench"],
            "totalCapacity": h["total_capacity"],
            "status": h["status"],
            "aisleAfterCol": h.get("aisle_after_col", [])
        })
    return jsonify(halls), 200

@api_bp.route('/halls', methods=['POST'])
def add_hall():
    if not supabase: return error_res("Supabase not configured", 500)
    data = request.json
    insert_data = {
        "name": data.get("name"),
        "building": data.get("building"),
        "rows": data.get("rows"),
        "cols": data.get("cols"),
        "seats_per_bench": data.get("seatsPerBench", 2),
        "status": data.get("status", "active"),
        "aisle_after_col": data.get("aisleAfterCol", [])
    }
    response = supabase.table('halls').insert(insert_data).execute()
    return jsonify(response.data[0] if response.data else {}), 201

@api_bp.route('/halls/<hall_id>', methods=['DELETE'])
def remove_hall(hall_id):
    if not supabase: return error_res("Supabase not configured", 500)
    supabase.table('halls').delete().eq('id', hall_id).execute()
    return jsonify({"message": "Deleted successfully"}), 200

# --- DEPARTMENTS ---

@api_bp.route('/departments', methods=['GET'])
def get_departments():
    if not supabase: return error_res("Supabase not configured", 500)
    response = supabase.table('departments').select('*').execute()
    return jsonify(response.data), 200

@api_bp.route('/departments', methods=['POST'])
def add_department():
    if not supabase: return error_res("Supabase not configured", 500)
    data = request.json
    insert_data = {
        "name": data.get("name"),
        "code": data.get("code")
    }
    response = supabase.table('departments').insert(insert_data).execute()
    return jsonify(response.data[0] if response.data else {}), 201

@api_bp.route('/departments/<dept_id>', methods=['DELETE'])
def remove_department(dept_id):
    if not supabase: return error_res("Supabase not configured", 500)
    supabase.table('departments').delete().eq('id', dept_id).execute()
    return jsonify({"message": "Deleted successfully"}), 200

# --- SUBJECTS ---

@api_bp.route('/subjects', methods=['GET'])
def get_subjects():
    if not supabase: return error_res("Supabase not configured", 500)
    # Join with departments to get department code
    response = supabase.table('subjects').select('*, departments(code)').execute()
    subjects = []
    for s in response.data:
        subjects.append({
            "id": s["id"],
            "code": s["code"],
            "name": s["name"],
            "department_id": s["department_id"],
            "department_code": s.get("departments", {}).get("code", "") if s.get("departments") else ""
        })
    return jsonify(subjects), 200

@api_bp.route('/subjects', methods=['POST'])
def add_subject():
    if not supabase: return error_res("Supabase not configured", 500)
    data = request.json
    insert_data = {
        "code": data.get("code"),
        "name": data.get("name"),
        "department_id": data.get("department_id")
    }
    response = supabase.table('subjects').insert(insert_data).execute()
    return jsonify(response.data[0] if response.data else {}), 201

@api_bp.route('/subjects/<subj_id>', methods=['DELETE'])
def remove_subject(subj_id):
    if not supabase: return error_res("Supabase not configured", 500)
    supabase.table('subjects').delete().eq('id', subj_id).execute()
    return jsonify({"message": "Deleted successfully"}), 200

# --- EXAM SCHEDULES ---

@api_bp.route('/schedules', methods=['POST'])
def add_schedule():
    if not supabase: return error_res("Supabase not configured", 500)
    data = request.json
    insert_data = {
        "subject_id": data.get("subjectId"),
        "date": data.get("date"),
        "time": data.get("time"),
        "session": data.get("session"),
        "allocation_status": "pending"
    }
    response = supabase.table('exam_schedules').insert(insert_data).execute()
    return jsonify(response.data[0] if response.data else {}), 201

@api_bp.route('/schedules/<schedule_id>', methods=['DELETE'])
def remove_schedule(schedule_id):
    if not supabase: return error_res("Supabase not configured", 500)
    supabase.table('exam_schedules').delete().eq('id', schedule_id).execute()
    return jsonify({"message": "Deleted successfully"}), 200

@api_bp.route('/schedules', methods=['GET'])
def get_schedules():
    if not supabase: return error_res("Supabase not configured", 500)
    response = supabase.table('exam_schedules').select('*, subjects!inner(*)').execute()
    
    schedules = []
    for item in response.data:
        schedule_id = item["id"]
        hall_res = supabase.table('exam_hall_assignments').select('halls(*)').eq('exam_schedule_id', schedule_id).execute()
        
        hall = None
        if hall_res.data and len(hall_res.data) > 0 and 'halls' in hall_res.data[0] and hall_res.data[0]['halls']:
             hall = hall_res.data[0]['halls']
             
        subject_id = item["subject_id"]
        count_res = supabase.table('student_enrollments').select('id', count='exact').eq('subject_id', subject_id).execute()
        students_count = count_res.count if count_res else 0
        
        schedules.append({
            "id": item["id"],
            "subjectCode": item["subjects"]["code"],
            "subjectName": item["subjects"]["name"],
            "date": item["date"],
            "time": item["time"],
            "session": item["session"],
            "allocationStatus": item["allocation_status"],
            "hallId": hall["id"] if hall else None,
            "hallName": f"{hall['name']} ({hall['building']})" if hall else None,
            "studentsCount": students_count,
            "hallsRequired": max(1, students_count // 50) if students_count > 0 else 0
        })
    return jsonify(schedules), 200

# --- STUDENTS ---

@api_bp.route('/students', methods=['GET'])
def get_students():
    if not supabase: return error_res("Supabase not configured", 500)
    response = supabase.table('students').select('*, departments(name)').execute()
    
    students_list = []
    for item in response.data:
        dept = item.get("departments", {})
        students_list.append({
            "id": item.get("id"),
            "roll_no": item.get("roll_no"),
            "name": item.get("name"),
            "email": item.get("email", ""),
            "department": dept.get("name", "Unknown") if dept else "Unknown"
        })
    return jsonify(students_list), 200

@api_bp.route('/students', methods=['DELETE'])
def clear_all_students():
    if not supabase: return error_res("Supabase not configured", 500)
    try:
        # Delete dependencies first to avoid Postgres foreign key constraint errors
        # if ON DELETE CASCADE is not configured.
        
        # 1. Delete seat allocations explicitly by forcing a true condition
        supabase.table('seat_allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        # 2. Delete all student enrollments
        supabase.table('student_enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        # 3. Delete all actual student records
        supabase.table('students').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        return jsonify({"message": "Successfully cleared all students and allocations."}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_res(str(e), 500)# --- FACULTY / INVIGILATORS ---

@api_bp.route('/faculty', methods=['GET'])
def get_faculty():
    if not supabase: return error_res("Supabase not configured", 500)
    response = supabase.table('faculty').select('*, departments(name, code)').execute()
    faculty_list = []
    for f in response.data:
        faculty_list.append({
            "id": f["id"],
            "name": f["name"],
            "email": f["email"],
            "department_id": f["department_id"],
            "department_name": f.get("departments", {}).get("name", "") if f.get("departments") else "",
            "department_code": f.get("departments", {}).get("code", "") if f.get("departments") else ""
        })
    return jsonify(faculty_list), 200

@api_bp.route('/faculty', methods=['POST'])
def add_faculty():
    if not supabase: return error_res("Supabase not configured", 500)
    data = request.json
    email = data.get("email")
    
    import requests as http_requests
    
    # Try using service_role key for confirmed user creation via Supabase Admin REST API
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    auth_user_created = False
    
    if service_role_key:
        try:
            admin_res = http_requests.post(
                f"{supabase_url}/auth/v1/admin/users",
                headers={
                    "apikey": service_role_key,
                    "Authorization": f"Bearer {service_role_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "email": email,
                    "password": "Faculty@2026",
                    "email_confirm": True
                },
                timeout=10
            )
            if admin_res.status_code in (200, 201):
                auth_user_created = True
                print(f"Faculty auth user created with admin API for {email}")
            else:
                print(f"Admin API response: {admin_res.status_code} {admin_res.text}")
        except Exception as e:
            print(f"Admin auth creation failed: {e}")
    
    if not auth_user_created:
        # Fallback: regular sign_up. For this to work, disable email confirmations
        # in Supabase Dashboard → Authentication → Settings → Email Confirmations
        try:
            supabase.auth.sign_up({"email": email, "password": "Faculty@2026"})
            print(f"Faculty auth created via sign_up for {email} - may need email confirm")
        except Exception as e:
            print(f"sign_up attempt: {e}")
        
    insert_data = {
        "name": data.get("name"),
        "email": email,
        "department_id": data.get("department_id")
    }
    response = supabase.table('faculty').insert(insert_data).execute()
    return jsonify(response.data[0] if response.data else {}), 201

@api_bp.route('/faculty/<faculty_id>', methods=['DELETE'])
def remove_faculty(faculty_id):
    if not supabase: return error_res("Supabase not configured", 500)
    supabase.table('faculty').delete().eq('id', faculty_id).execute()
    return jsonify({"message": "Deleted successfully"}), 200

@api_bp.route('/faculty/<faculty_id>/reset-login', methods=['POST'])
def reset_faculty_login(faculty_id):
    """Re-confirm and reset the faculty auth user so they can log in with Faculty@2026."""
    if not supabase: return error_res("Supabase not configured", 500)
    
    fac_res = supabase.table('faculty').select('email').eq('id', faculty_id).execute()
    if not fac_res.data:
        return error_res("Faculty not found", 404)
    email = fac_res.data[0]['email']
    
    import requests as http_requests
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if service_role_key:
        # Fetch the auth user by email and update their password + confirm
        try:
            # List users to find by email
            list_res = http_requests.get(
                f"{supabase_url}/auth/v1/admin/users?email={email}",
                headers={
                    "apikey": service_role_key,
                    "Authorization": f"Bearer {service_role_key}"
                },
                timeout=10
            )
            users = list_res.json().get("users", [])
            if users:
                uid = users[0]["id"]
                # Update: confirm + reset password
                http_requests.put(
                    f"{supabase_url}/auth/v1/admin/users/{uid}",
                    headers={
                        "apikey": service_role_key,
                        "Authorization": f"Bearer {service_role_key}",
                        "Content-Type": "application/json"
                    },
                    json={"password": "Faculty@2026", "email_confirm": True},
                    timeout=10
                )
                return jsonify({"message": f"Login reset for {email}. Faculty can now log in with Faculty@2026"}), 200
            else:
                # Create new confirmed user
                cr = http_requests.post(
                    f"{supabase_url}/auth/v1/admin/users",
                    headers={
                        "apikey": service_role_key,
                        "Authorization": f"Bearer {service_role_key}",
                        "Content-Type": "application/json"
                    },
                    json={"email": email, "password": "Faculty@2026", "email_confirm": True},
                    timeout=10
                )
                return jsonify({"message": f"Auth user created for {email}"}), 200
        except Exception as e:
            return error_res(f"Admin API failed: {str(e)}", 500)
    else:
        # Without service_role key: try sign_up again (works only if email confirmations are OFF in Supabase settings)
        try:
            supabase.auth.sign_up({"email": email, "password": "Faculty@2026"})
            return jsonify({"message": f"sign_up attempted for {email}. Ensure email confirmations are disabled in Supabase settings."}), 200
        except Exception as e:
            return error_res(str(e), 500)


@api_bp.route('/students/enroll-all', methods=['POST'])
def enroll_all_students():
    """Backfill: Enroll ALL existing students into subjects matching their department."""
    if not supabase: return error_res("Supabase not configured", 500)
    try:
        # Fetch all subjects grouped by department
        all_subjects = supabase.table('subjects').select('id, department_id').execute().data
        dept_subjects_map = {}
        for s in all_subjects:
            dept_id = s.get('department_id')
            if dept_id:
                if dept_id not in dept_subjects_map:
                    dept_subjects_map[dept_id] = []
                dept_subjects_map[dept_id].append(s['id'])

        # Fetch all students in batches (Supabase default limit = 1000)
        all_students = []
        offset = 0
        batch = 1000
        while True:
            res = supabase.table('students').select('id, department_id').range(offset, offset + batch - 1).execute()
            all_students.extend(res.data)
            if len(res.data) < batch:
                break
            offset += batch

        # Fetch existing enrollments to avoid duplicates
        existing_enrolls_set = set()
        offset = 0
        while True:
            res = supabase.table('student_enrollments').select('student_id, subject_id').range(offset, offset + batch - 1).execute()
            for e in res.data:
                existing_enrolls_set.add((e['student_id'], e['subject_id']))
            if len(res.data) < batch:
                break
            offset += batch

        new_enrolls = []
        for stu in all_students:
            dept_id = stu.get('department_id')
            if dept_id:
                for sub_id in dept_subjects_map.get(dept_id, []):
                    if (stu['id'], sub_id) not in existing_enrolls_set:
                        new_enrolls.append({"student_id": stu['id'], "subject_id": sub_id})
                        existing_enrolls_set.add((stu['id'], sub_id))

        if new_enrolls:
            for i in range(0, len(new_enrolls), 100):
                supabase.table('student_enrollments').insert(new_enrolls[i:i+100]).execute()

        return jsonify({"message": f"Enrolled {len(new_enrolls)} new student-subject pairs across {len(all_students)} students."}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_res(str(e), 500)

@api_bp.route('/students/bulk', methods=['POST'])
def bulk_upload_students():
    if not supabase: return error_res("Supabase not configured", 500)
    data = request.json
    if not data or not isinstance(data, list):
        return error_res("Invalid data format", 400)
        
    try:
        # 1. Upsert Departments
        dept_names = list(set([d.get('department') for d in data if d.get('department')]))
        existing_depts = supabase.table('departments').select('*').in_('name', dept_names).execute()
        dept_map = {d['name']: d['id'] for d in existing_depts.data}
        # Add missing departments
        missing_depts = [{"name": name, "code": name[:3].upper()} for name in dept_names if name not in dept_map]
        if missing_depts:
            new_depts = supabase.table('departments').insert(missing_depts).execute()
            for d in new_depts.data: dept_map[d['name']] = d['id']
            
        # 2. Fetch all subjects to auto-enroll students based on their department
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
        missing_stus = []
        for d in data:
            if d.get('rollNo') not in stu_map and d.get('rollNo') not in [s['roll_no'] for s in missing_stus]:
                missing_stus.append({
                    "roll_no": d.get('rollNo'), 
                    "name": d.get('name'), 
                    "email": d.get('email'),
                    "department_id": dept_map.get(d.get('department'))
                })
        if missing_stus:
            for i in range(0, len(missing_stus), 100):
                 new_stus = supabase.table('students').insert(missing_stus[i:i+100]).execute()
                 for s in new_stus.data: stu_map[s['roll_no']] = s['id']
                 
        # 4. Upsert Enrollments (Auto-enroll in all subjects of their department)
        existing_enrolls = supabase.table('student_enrollments').select('*').in_('student_id', list(stu_map.values())).execute()
        enroll_set = set([(e['student_id'], e['subject_id']) for e in existing_enrolls.data])
        
        new_enrolls = []
        for d in data:
            stu_id = stu_map.get(d.get('rollNo'))
            dept_id = dept_map.get(d.get('department'))
            if stu_id and dept_id:
                # get all subject IDs for this department
                dept_subject_ids = dept_subjects_map.get(dept_id, [])
                for sub_id in dept_subject_ids:
                    if (stu_id, sub_id) not in enroll_set:
                        new_enrolls.append({"student_id": stu_id, "subject_id": sub_id})
                        enroll_set.add((stu_id, sub_id))
                
        if new_enrolls:
            for i in range(0, len(new_enrolls), 100):
                supabase.table('student_enrollments').insert(new_enrolls[i:i+100]).execute()
                
        return jsonify({"message": f"Successfully processed {len(data)} records"}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_res(str(e), 500)

# --- STUDENT SEARCH ---
@api_bp.route('/students/<reg_no>/search', methods=['GET'])
def search_student(reg_no):
    if not supabase: return error_res("Supabase not configured", 500)
    stu_res = supabase.table('students').select('*, departments(*)').eq('roll_no', reg_no).execute()
    if not stu_res.data:
        return error_res("Student not found", 404)
    student = stu_res.data[0]
    
    alloc_res = supabase.table('seat_allocations').select('*, halls(*), exam_schedules(*, subjects(*))').eq('student_id', student['id']).execute()
    if not alloc_res.data:
        return error_res("No seat allocated yet", 404)
        
    alloc = alloc_res.data[0]
    hall = alloc['halls']
    exam = alloc['exam_schedules']
    subj = exam['subjects']
    dept = student['departments']
    
    return jsonify({
        "student": {
            "id": student['id'],
            "rollNo": student['roll_no'],
            "name": student['name'],
            "department": dept['name'] if dept else '',
            "subjectCode": subj['code'],
            "subjectName": subj['name']
        },
        "examDate": exam['date'],
        "time": exam['time'],
        "subjectName": subj['name'],
        "hallBuilding": hall['building'],
        "hallName": hall['name'],
        "seatCode": alloc['seat_code'],
        "seatRow": alloc['row_index'],
        "seatCol": alloc['bench_index'],
        "position": alloc['position'],
        "totalRows": hall['rows'],
        "totalCols": hall['cols']
    }), 200

# --- SEAT ALLOCATION ENGINE ---

@api_bp.route('/allocations/generate', methods=['POST'])
def generate_allocation():
    if not supabase: return error_res("Supabase not configured", 500)
    data = request.json
    exam_schedule_id = data.get("examScheduleId")
    if not exam_schedule_id: return error_res("Missing examScheduleId", 400)
        
    try:
        exam_res = supabase.table('exam_schedules').select('*').eq('id', exam_schedule_id).execute()
        if not exam_res.data: return error_res("Exam schedule not found", 404)
        
        target_exam = exam_res.data[0]
        date, time, session = target_exam['date'], target_exam['time'], target_exam['session']
        
        con_exams = supabase.table('exam_schedules').select('*').eq('date', date).eq('time', time).eq('session', session).execute().data
        con_ids = [e['id'] for e in con_exams]
        
        # Fetch assigned halls
        assigns = supabase.table('exam_hall_assignments').select('halls(*)').in_('exam_schedule_id', con_ids).execute().data
        assigned_halls = list({a['halls']['id']: a['halls'] for a in assigns if a.get('halls')}.values())
        assigned_hall_ids = {h['id'] for h in assigned_halls}
        
        # Fetch all active halls
        all_active_halls = supabase.table('halls').select('*').eq('status', 'active').execute().data
        halls = assigned_halls + [h for h in all_active_halls if h['id'] not in assigned_hall_ids]
        
        if not halls: return error_res("No active halls available", 400)
        
        all_students = []
        for ex in con_exams:
            enr = supabase.table('student_enrollments').select('students(*, departments(*))').eq('subject_id', ex['subject_id']).execute().data
            for e in enr:
                stu = e.get('students')
                if stu:
                    stu['__exam_id'] = ex['id']
                    stu['__dept_name'] = stu.get('departments', {}).get('name', 'Unknown') if stu.get('departments') else 'Unknown'
                    all_students.append(stu)

        if not all_students:
            return error_res("No enrolled students found for this exam session. Please upload and commit student data first.", 400)
                    
        # group all students by department, sorted by roll no
        dept_groups = {}
        for s in all_students:
            d = s['__dept_name']
            if d not in dept_groups: dept_groups[d] = []
            dept_groups[d].append(s)
            
        for d in dept_groups:
             dept_groups[d].sort(key=lambda x: x.get('roll_no', ''))
                    
        supabase.table('seat_allocations').delete().in_('exam_schedule_id', con_ids).execute()
        
        allocations = []
        new_hall_assignments = []
        allocated_count = 0
        total_stus = sum(len(q) for q in dept_groups.values())
        
        L_dept = None
        R_dept = None
        
        for hall in halls:
            if allocated_count >= total_stus: break
            if hall['status'] != 'active': continue
            
            allocated_in_hall = 0
            rows, cols = hall['rows'], hall['cols']
            max_capacity = 50
            
            # Record assignment if this hall is newly pulled in
            if hall['id'] not in assigned_hall_ids:
                new_hall_assignments.append({"exam_schedule_id": exam_schedule_id, "hall_id": hall['id']})
                assigned_hall_ids.add(hall['id'])

            # Column-wise allocation
            for c in range(cols):
                if allocated_count >= total_stus or allocated_in_hall >= max_capacity: break
                for r in range(rows):
                    if allocated_count >= total_stus or allocated_in_hall >= max_capacity: break
                    
                    # Fill Left
                    if L_dept is None or len(dept_groups.get(L_dept, [])) == 0:
                        best = None; mx = 0
                        for d, q in dept_groups.items():
                            if d != R_dept and len(q) > mx:
                                best = d; mx = len(q)
                        if best is None:
                            for d, q in dept_groups.items():
                                if len(q) > 0: best = d; break
                        L_dept = best

                    if L_dept:
                        stu = dept_groups[L_dept].pop(0)
                        allocations.append({
                            "exam_schedule_id": stu['__exam_id'],
                            "hall_id": hall['id'],
                            "student_id": stu['id'],
                            "seat_code": f"R{r+1}C{c+1}L",
                            "row_index": r, "bench_index": c, "position": "L", "status": "occupied"
                        })
                        allocated_in_hall += 1
                        allocated_count += 1
                        if len(dept_groups[L_dept]) == 0: L_dept = None

                    if allocated_count >= total_stus or allocated_in_hall >= max_capacity: break
                    
                    # Fill Right
                    if R_dept is None or len(dept_groups.get(R_dept, [])) == 0:
                        best = None; mx = 0
                        for d, q in dept_groups.items():
                            if d != L_dept and len(q) > mx:
                                best = d; mx = len(q)
                        if best is None:
                            for d, q in dept_groups.items():
                                if len(q) > 0: best = d; break
                        R_dept = best

                    if R_dept:
                        stu = dept_groups[R_dept].pop(0)
                        allocations.append({
                            "exam_schedule_id": stu['__exam_id'],
                            "hall_id": hall['id'],
                            "student_id": stu['id'],
                            "seat_code": f"R{r+1}C{c+1}R",
                            "row_index": r, "bench_index": c, "position": "R", "status": "occupied"
                        })
                        allocated_in_hall += 1
                        allocated_count += 1
                        if len(dept_groups[R_dept]) == 0: R_dept = None
                            
        if new_hall_assignments:
            supabase.table('exam_hall_assignments').insert(new_hall_assignments).execute()
                            
        if allocations:
            for i in range(0, len(allocations), 100):
                 supabase.table('seat_allocations').insert(allocations[i:i+100]).execute()
                 
            # Send notifications asynchronously or here (synchronously for MVP)
            # Since students might not have real emails in the DB, we will use a dummy one
            # if the student email isn't available, or simulate.
            # In a real system, you'd fetch the student email and pass it down.
            for alloc in allocations:
                # Assuming student email could be fetched from `stu` obj, which currently may not have it.
                # We'll mock it passing `student_{id}@example.com`
                exam_subj = target_exam.get('subjects', {}).get('name', 'Subject') if target_exam.get('subjects') else 'Subject'
                
                hall_name = "Unknown Hall"
                for h in halls:
                    if h['id'] == alloc['hall_id']:
                        hall_name = h['name']
                        break
                        
                send_allocation_email(
                    student_email=f"student_{alloc['student_id'][:8]}@example.com",
                    student_name="Student",
                    subject_name=exam_subj,
                    date=date,
                    time=time,
                    hall_name=hall_name,
                    seat_code=alloc['seat_code']
                )
                 
        supabase.table('exam_schedules').update({"allocation_status": "allocated"}).in_('id', con_ids).execute()
        
        return jsonify({"message": f"Allocated {len(allocations)} students across {len(con_exams)} concurrent exams"}), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_res(str(e), 500)


@api_bp.route('/allocations/<exam_schedule_id>', methods=['GET'])
def get_allocations(exam_schedule_id):
    if not supabase: return error_res("Supabase not configured", 500)
    
    exam_res = supabase.table('exam_schedules').select('*, subjects(*)').eq('id', exam_schedule_id).execute()
    subj = exam_res.data[0]['subjects'] if exam_res.data and exam_res.data[0].get('subjects') else {}
    subj_code = subj.get('code', '')
    subj_name = subj.get('name', '')

    response = supabase.table('seat_allocations').select('*, students!inner(*, departments!inner(*))').eq('exam_schedule_id', exam_schedule_id).execute()
    
    result = []
    for item in response.data:
        stu = item['students']
        dept = stu['departments']
        result.append({
            "id": item['id'],
            "hallId": item['hall_id'],
            "seatCode": item['seat_code'],
            "row": item['row_index'],
            "bench": item['bench_index'],  
            "position": item['position'],
            "status": item['status'],
            "student": {
                "id": stu['id'],
                "rollNo": stu['roll_no'],
                "name": stu['name'],
                "department": dept['name'],
                "subjectCode": subj_code,  
                "subjectName": subj_name
            }
        })
    return jsonify(result), 200

# --- ATTENDANCE ---
@api_bp.route('/allocations/<allocation_id>/attendance', methods=['PUT'])
def update_attendance(allocation_id):
    if not supabase: return error_res("Supabase not configured", 500)
    data = request.json
    status = data.get("status")
    if status not in ["present", "absent", "malpractice"]:
        return error_res("Invalid status", 400)
        
    response = supabase.table('seat_allocations').update({"status": status}).eq('id', allocation_id).execute()
    return jsonify(response.data[0] if response.data else {}), 200

# --- STATS ---

@api_bp.route('/stats', methods=['GET'])
def get_stats():
    if not supabase: return error_res("Supabase not configured", 500)
    try:
        halls_count_res = supabase.table('halls').select('id', count='exact').execute()
        students_count_res = supabase.table('students').select('id', count='exact').execute()
        
        halls_count = halls_count_res.count if halls_count_res else 0
        students_count = students_count_res.count if students_count_res else 0
        
        schedules_res = supabase.table('exam_schedules').select('allocation_status').execute()
        total_schedules = len(schedules_res.data) if schedules_res and schedules_res.data else 0
        allocated_schedules = len([s for s in schedules_res.data if s.get('allocation_status') == 'allocated']) if total_schedules else 0
        allocation_percentage = int((allocated_schedules / total_schedules) * 100) if total_schedules > 0 else 0
        
        depts_res = supabase.table('departments').select('*').execute()
        faculty_progress = []
        if depts_res.data:
            for d in depts_res.data:
                prog = 100 if allocation_percentage == 100 else random.randint(40, 95)
                faculty_progress.append({
                    "name": d['name'],
                    "progress": prog
                })
        else:
             faculty_progress = [
                { "name": "Faculty of Engineering", "progress": allocation_percentage },
                { "name": "Faculty of Science", "progress": allocation_percentage }
            ]

        return jsonify({
            "totalHalls": halls_count,
            "registeredStudents": students_count,
            "allocationPercentage": allocation_percentage,
            "facultyProgress": faculty_progress
        }), 200
    except Exception as e:
        print(f"Stats Error: {e}")
        return error_res(str(e), 500)
