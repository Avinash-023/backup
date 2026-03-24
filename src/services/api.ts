// API service layer communicating with Flask backend

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export interface Hall {
  id: string;
  name: string;
  building: string;
  rows: number;
  cols: number; // number of benches per row
  seatsPerBench: number; // always 2
  totalCapacity: number; // rows * cols * seatsPerBench
  status: 'active' | 'maintenance';
  aisleAfterCol?: number[];
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  department: string;
  subjectCode: string;
  subjectName: string;
}

export interface SeatAllocation {
  id?: string;
  hallId?: string;
  seatCode: string;
  row: number;
  bench: number; // bench index (0-based)
  position: 'L' | 'R'; // left or right seat on the bench
  status: 'occupied' | 'empty' | 'blocked';
  student?: Student;
}

export interface ExamSchedule {
  id: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  time: string;
  session: 'Morning' | 'Afternoon';
  hallId?: string;
  hallName?: string;
  studentsCount?: number;
  hallsRequired?: number;
  allocationStatus: 'pending' | 'allocated' | 'conflict';
}

export interface Subject {
  id: string;
  code: string;
  name: string;
}

export interface StudentSearchResult {
  student: Student;
  examDate: string;
  time: string;
  subjectName: string;
  hallBuilding: string;
  hallName: string;
  seatCode: string;
  seatRow: number;
  seatCol: number;
  position: 'L' | 'R';
  totalRows: number;
  totalCols: number;
}

export interface EnrollmentRow {
  rollNo: string;
  name: string;
  email: string;
  department: string;
  status: 'validated' | 'error';
  remarks: string;
}

// --- ASYNC API FUNCTIONS ---

export async function fetchHalls(): Promise<Hall[]> {
  const res = await fetch(`${API_BASE_URL}/halls`);
  if (!res.ok) throw new Error('Failed to fetch halls');
  return res.json();
}

export async function createHall(hall: Partial<Hall>): Promise<Hall> {
  const res = await fetch(`${API_BASE_URL}/halls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hall)
  });
  if (!res.ok) throw new Error('Failed to create hall');
  return res.json();
}

export async function deleteHall(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/halls/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete hall');
}

export async function fetchSubjects(): Promise<Subject[]> {
  const res = await fetch(`${API_BASE_URL}/subjects`);
  if (!res.ok) throw new Error('Failed to fetch subjects');
  return res.json();
}

export async function createSchedule(data: { subjectId: string, date: string, time: string, session: string }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create schedule');
  return res.json();
}

export async function deleteSchedule(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete schedule');
}

export async function fetchSchedules(): Promise<ExamSchedule[]> {
  const res = await fetch(`${API_BASE_URL}/schedules`);
  if (!res.ok) throw new Error('Failed to fetch schedules');
  return res.json();
}

export async function fetchEnrollmentData(): Promise<EnrollmentRow[]> {
  const res = await fetch(`${API_BASE_URL}/students`);
  if (!res.ok) throw new Error('Failed to fetch students');
  const students = await res.json();
  return students.map((s: any) => ({
    rollNo: s.roll_no,
    name: s.name,
    email: s.email || `${s.roll_no.toLowerCase()}@example.com`,
    department: s.department || "Unknown",
    status: 'validated',
    remarks: 'Loaded from DB'
  }));
}

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE_URL}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function generateSeatingMatrixApi(examScheduleId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/allocations/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examScheduleId })
  });
  if (!res.ok) {
    let msg = 'Failed to generate seating matrix';
    try {
      const errData = await res.json();
      if (errData.error) msg = errData.error;
    } catch(e) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchSeatAllocations(examScheduleId: string): Promise<SeatAllocation[]> {
  const res = await fetch(`${API_BASE_URL}/allocations/${examScheduleId}`);
  if (!res.ok) throw new Error('Failed to fetch allocations');
  return res.json();
}

export async function searchStudentApi(regNo: string): Promise<StudentSearchResult | null> {
  const res = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(regNo)}/search`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to search student');
  }
  return res.json();
}

export async function bulkUploadEnrollments(data: any[]): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/students/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      let msg = 'Failed to upload data';
      try {
        const errData = await res.json();
        if (errData.error) msg += `: ${errData.error}`;
      } catch(e) {}
      throw new Error(msg);
    }
    return res.json();
}

export async function clearAllStudents(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/students`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to clear students from database');
}
