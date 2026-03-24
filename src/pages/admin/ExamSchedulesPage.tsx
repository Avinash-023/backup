import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { fetchSchedules, fetchSubjects, createSchedule, deleteSchedule } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function ExamSchedulesPage() {
  const queryClient = useQueryClient();
  const { data: schedules = [], isLoading } = useQuery({ queryKey: ['schedules'], queryFn: fetchSchedules });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects });

  const [newSched, setNewSched] = useState({ subjectId: '', date: '', time: '10:00 AM', session: 'Morning' });

  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setNewSched({ subjectId: '', date: '', time: '10:00 AM', session: 'Morning' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] })
  });

  const handleAdd = () => {
    if (!newSched.subjectId || !newSched.date) return;
    createMutation.mutate(newSched);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-mono flex items-center justify-center gap-2">
      <div className="h-4 w-4 bg-primary rounded-full animate-bounce"></div> Loading exam schedules...
    </div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exam Schedules</h1>
          <p className="text-sm text-muted-foreground">View and manage upcoming examination schedules.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card-surface overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30">
                {['Subject', 'Date', 'Session', 'Hall', 'Students', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.id} className="border-b hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium">{s.subjectName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.subjectCode}</p>
                  </td>
                  <td className="px-5 py-4 tabular-nums">{s.date}</td>
                  <td className="px-5 py-4">{s.session}</td>
                  <td className="px-5 py-4">{s.hallName || 'TBA'}</td>
                  <td className="px-5 py-4 tabular-nums">{s.studentsCount || 0}</td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className={
                      s.allocationStatus === 'allocated' ? 'border-success text-success bg-success/10' :
                      s.allocationStatus === 'conflict' ? 'border-destructive text-destructive bg-destructive/10' :
                      'border-warning text-warning bg-warning/10'
                    }>
                      {s.allocationStatus.charAt(0).toUpperCase() + s.allocationStatus.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => deleteMutation.mutate(s.id)} disabled={deleteMutation.isPending} className="rounded-sm p-2 hover:bg-destructive/10 transition-colors disabled:opacity-50">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    No exam schedules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Create Schedule Card */}
        <div className="card-surface p-5 h-fit">
          <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
            <Plus className="h-4 w-4 text-primary" /> Schedule Exam
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Subject</label>
              <select value={newSched.subjectId} onChange={e => setNewSched({...newSched, subjectId: e.target.value})} className="mt-1 h-10 w-full rounded-sm border bg-background px-3 text-sm focus:outline-none focus:ring-1">
                <option value="">Select a subject...</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Date</label>
              <input type="date" value={newSched.date} onChange={e => setNewSched({...newSched, date: e.target.value})} className="mt-1 h-10 w-full rounded-sm border bg-background px-3 text-sm focus:outline-none focus:ring-1" />
            </div>
            <div>
              <label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Time</label>
              <input type="text" value={newSched.time} onChange={e => setNewSched({...newSched, time: e.target.value})} placeholder="e.g. 10:00 AM" className="mt-1 h-10 w-full rounded-sm border bg-background px-3 text-sm focus:outline-none focus:ring-1" />
            </div>
            <div>
              <label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Session</label>
              <select value={newSched.session} onChange={e => setNewSched({...newSched, session: e.target.value})} className="mt-1 h-10 w-full rounded-sm border bg-background px-3 text-sm focus:outline-none focus:ring-1">
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
              </select>
            </div>
          </div>
          <button onClick={handleAdd} disabled={createMutation.isPending || !newSched.subjectId || !newSched.date} className="mt-6 w-full flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create Schedule
          </button>
        </div>
      </div>
    </motion.div>
  );
}
