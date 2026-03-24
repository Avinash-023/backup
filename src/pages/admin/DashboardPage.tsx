import { motion } from "framer-motion";
import { LayoutDashboard, Users, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { fetchDashboardStats, fetchSchedules } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] } } };

function statusBadge(status: string) {
  if (status === 'pending') return <Badge variant="outline" className="border-warning text-warning bg-warning/10">Pending</Badge>;
  if (status === 'allocated') return <Badge variant="outline" className="border-success text-success bg-success/10">Allocated</Badge>;
  return <Badge variant="outline" className="border-destructive text-destructive bg-destructive/10">Conflict</Badge>;
}

export default function DashboardPage() {
  const { data: dashboardStats = { totalHalls: 0, registeredStudents: 0, allocationPercentage: 0, facultyProgress: [] }, isLoading: isStatsLoading } = useQuery({ queryKey: ['stats'], queryFn: fetchDashboardStats });
  const { data: mockSchedules = [], isLoading: isSchedulesLoading } = useQuery({ queryKey: ['schedules'], queryFn: fetchSchedules });

  if (isStatsLoading || isSchedulesLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-mono flex items-center justify-center gap-2">
      <div className="h-4 w-4 bg-primary rounded-full animate-bounce"></div> Loading dashboard assets...
    </div>;
  }

  const hasConflict = mockSchedules.some(s => s.allocationStatus === 'conflict');

  const statCards = [
    { label: "TOTAL HALLS", value: dashboardStats.totalHalls, change: "+2%", icon: LayoutDashboard, color: "bg-primary" },
    { label: "REGISTERED STUDENTS", value: dashboardStats.registeredStudents.toLocaleString(), change: "+120", icon: Users, color: "bg-occupied" },
    { label: "ALLOCATION STATUS", value: `${dashboardStats.allocationPercentage}%`, suffix: "Completed", change: "+5%", icon: CheckCircle2, color: "bg-success" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {hasConflict && (
        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-sm bg-destructive/5 border border-destructive/20 px-5 py-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Conflict Alert: Action Required</p>
              <p className="text-xs text-muted-foreground">Allocation pending for 3 upcoming exams or capacity exceeded in Hall B-204.</p>
            </div>
          </div>
          <button className="rounded-sm bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors shrink-0">
            Resolve Conflicts
          </button>
        </motion.div>
      )}

      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Real-time metrics and system health for the current semester.</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${card.color}/10`}>
                <card.icon className={`h-4 w-4`} style={{ color: `hsl(var(--${card.color === 'bg-primary' ? 'primary' : card.color === 'bg-occupied' ? 'occupied' : 'success'}))` }} />
              </div>
              <span className="flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" />
                {card.change}
              </span>
            </div>
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{card.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">{card.value}</span>
              {card.suffix && <span className="text-sm text-muted-foreground">{card.suffix}</span>}
            </div>
            <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full ${card.color}`} style={{ width: card.color === 'bg-primary' ? '45%' : card.color === 'bg-occupied' ? '65%' : '85%' }} />
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Deadlines */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Upcoming Allocation Deadlines</h2>
            <button className="text-xs font-medium text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {mockSchedules.length > 0 ? mockSchedules.map((s) => (
              <div key={s.id} className="flex items-center gap-4 rounded-sm p-3 hover:bg-secondary/50 transition-colors">
                <div className="flex h-10 w-10 flex-col items-center justify-center rounded-sm bg-primary/5 text-primary">
                  <span className="text-[9px] font-bold uppercase">{s.date.split(' ')[0] || ''}</span>
                  <span className="text-sm font-bold leading-none">{(s.date.split(' ')[1] || '').replace(',', '')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.subjectName}</p>
                  <p className="text-xs text-muted-foreground">{s.studentsCount || 0} Students • {s.hallsRequired || 0} Halls Required</p>
                </div>
                {statusBadge(s.allocationStatus)}
              </div>
            )) : <p className="text-xs text-muted-foreground h-16 flex items-center justify-center">No upcoming schedules.</p>}
          </div>
        </div>

        {/* Faculty Progress */}
        <div className="card-surface p-5">
          <h2 className="text-base font-semibold mb-4">Allocation Progress by Faculty</h2>
          <div className="space-y-5">
            {dashboardStats.facultyProgress.map((f: any) => (
              <div key={f.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{f.name}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: f.progress === 100 ? 'hsl(var(--success))' : f.progress < 50 ? 'hsl(var(--warning))' : 'hsl(var(--primary))' }}>{f.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${f.progress}%`,
                      backgroundColor: f.progress === 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
