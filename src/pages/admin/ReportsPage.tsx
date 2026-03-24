import { motion } from "framer-motion";
import { FileBarChart, Printer, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchSchedules, fetchHalls, fetchSeatAllocations } from "@/services/api";

function ReportMatrix({ event, halls, combinedSeats }: { event: any, halls: any[], combinedSeats: any[] }) {
  if (!combinedSeats.length) return <div className="p-4 text-center text-sm text-muted-foreground">No allocations found.</div>;

  const allocatedHallIds = Array.from(new Set(combinedSeats.map(s => s.hallId).filter(Boolean)));
  const displayHalls = allocatedHallIds.map(hId => halls.find(h => h.id === hId)).filter(Boolean) as any[];

  return (
    <div className="space-y-8 mt-4 print:mt-0">
      {displayHalls.map((h, hIdx) => {
        function getSeatAt(row: number, bench: number, position: 'L' | 'R') {
          return combinedSeats.find(s => s.hallId === h.id && s.row === row && s.bench === bench && s.position === position);
        }
        const hOccupied = combinedSeats.filter(s => s.hallId === h.id && s.status === 'occupied').length;

        // Group the subjects that are practically present in this hall based on the combinedSeats
        const uniqueSubjectsInHall = Array.from(new Set(
          combinedSeats
            .filter(s => s.hallId === h.id && s.student && s.student.subjectCode)
            .map(s => `${s.student.subjectCode} - ${s.student.subjectName}`)
        ));

        return (
          <div key={h.id} className="border rounded-sm p-6 bg-card print:border-none print:shadow-none print:break-inside-avoid print:p-0">
            {/* Report Header for Print */}
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-wide">Hall Allocation Report</h3>
                <p className="text-sm text-muted-foreground mt-1">Hall: <span className="font-semibold text-foreground">{h.name}</span></p>
                <p className="text-sm text-muted-foreground">Capacity Used: <span className="font-semibold text-foreground">{hOccupied} Students</span></p>
              </div>
              <div className="text-right text-sm">
                <p><span className="text-muted-foreground">Date:</span> <span className="font-semibold">{event.date}</span></p>
                <p><span className="text-muted-foreground">Session:</span> <span className="font-semibold">{event.session} ({event.time})</span></p>
                {uniqueSubjectsInHall.length > 0 && (
                   <p className="max-w-[300px] whitespace-normal"><span className="text-muted-foreground">Subjects:</span> <span className="font-semibold">{uniqueSubjectsInHall.join(', ')}</span></p>
                )}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto pb-4">
              {/* Benches */}
              <div className="inline-flex flex-col gap-2 min-w-[800px]">
                 <div className="flex justify-between items-center bg-muted/30 p-2 text-xs font-semibold uppercase tracking-wider rounded-sm text-center mb-4">
                    <span className="w-full">Invigilator Desk / Whiteboard</span>
                 </div>
                 
                 {Array.from({ length: h.rows }, (_, row) => (
                    <div key={row} className="flex gap-4 mb-4">
                      <div className="w-12 flex items-center justify-center text-[10px] font-medium text-muted-foreground py-2 border-r bg-muted/5">Row {row + 1}</div>
                      {Array.from({ length: h.cols }, (_, bench) => {
                         const leftSeat = getSeatAt(row, bench, 'L');
                         const rightSeat = getSeatAt(row, bench, 'R');
                         return (
                           <div key={bench} className="flex flex-col border rounded-sm overflow-hidden flex-1 min-w-[140px]">
                              <div className="bg-muted/40 text-[10px] font-bold text-center py-1 border-b">Col {String.fromCharCode(65 + bench)}</div>
                              <div className="flex divide-x h-full">
                                <div className="flex-1 p-2 flex flex-col items-center justify-center min-h-[60px] bg-background">
                                  <span className="text-xs font-bold">{leftSeat?.seatCode}</span>
                                  {leftSeat?.student && (
                                    <>
                                      <span className="text-[11px] font-mono mt-1 font-semibold">{leftSeat.student.rollNo}</span>
                                      <span className="text-[9px] text-muted-foreground truncate max-w-[65px]">{leftSeat.student.department}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex-1 p-2 flex flex-col items-center justify-center min-h-[60px] bg-background">
                                  <span className="text-xs font-bold">{rightSeat?.seatCode}</span>
                                  {rightSeat?.student && (
                                    <>
                                      <span className="text-[11px] font-mono mt-1 font-semibold">{rightSeat.student.rollNo}</span>
                                      <span className="text-[9px] text-muted-foreground truncate max-w-[65px]">{rightSeat.student.department}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                           </div>
                         );
                      })}
                    </div>
                 ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ExpandableEventCard({ event, halls }: { event: any, halls: any[] }) {
  const [expanded, setExpanded] = useState(false);

  // Fetch all allocations for all schedules in this event
  const queryResults = useQueries({
    queries: event.schedules.map((s: any) => ({
      queryKey: ['allocations', s.id],
      queryFn: () => fetchSeatAllocations(s.id),
      enabled: expanded
    }))
  });

  const isLoading = queryResults.some(q => q.isLoading);
  const combinedSeats = queryResults.flatMap(q => q.data || []);

  const uniqueSubjects = Array.from(new Set(event.schedules.map((s: any) => s.subjectCode))).join(', ');

  return (
    <div className="card-surface border rounded-sm overflow-hidden print:border-none print:shadow-none mb-4">
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors print:hidden gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="font-semibold text-lg">{event.date} | {event.session} Session</h3>
          <p className="text-sm text-muted-foreground mt-1">Time: {event.time}</p>
          <p className="text-sm text-muted-foreground">Subjects: {uniqueSubjects}</p>
        </div>
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); setExpanded(true); setTimeout(() => window.print(), 500); }}
            className="flex items-center gap-2 text-sm text-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-sm transition-colors"
          >
            <Printer className="h-4 w-4" /> Print Halls
          </button>
          {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="p-4 border-t bg-muted/5 print:bg-white print:p-0 print:border-none">
          {isLoading ? (
            <div className="p-4 text-center text-sm animate-pulse">Loading allocations...</div>
          ) : (
            <ReportMatrix event={event} halls={halls} combinedSeats={combinedSeats} />
          )}
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const { data: schedules = [], isLoading: schedsLoading } = useQuery({ queryKey: ['schedules'], queryFn: fetchSchedules });
  const { data: halls = [], isLoading: hallsLoading } = useQuery({ queryKey: ['halls'], queryFn: fetchHalls });

  const allocatedSchedules = schedules.filter(s => s.allocationStatus === 'allocated');

  // Group by Exam Event (Date + Time + Session)
  const groupedEvents = allocatedSchedules.reduce((acc: any, schedule) => {
    const key = `${schedule.date}_${schedule.time}_${schedule.session}`;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        date: schedule.date,
        time: schedule.time,
        session: schedule.session,
        schedules: []
      };
    }
    acc[key].schedules.push(schedule);
    return acc;
  }, {});

  const eventList = Object.values(groupedEvents);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 print:space-y-0 print:m-0">
      <div className="print:hidden flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hall Allocation Reports</h1>
          <p className="text-sm text-muted-foreground">View and print combined seating matrices for each hall used during an exam session.</p>
        </div>
      </div>
      
      {schedsLoading || hallsLoading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse">Loading reports data...</div>
      ) : eventList.length === 0 ? (
        <div className="card-surface p-12 flex flex-col items-center justify-center text-center print:hidden">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <FileBarChart className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">No Reports Available</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Reports will be available here once exam seating allocations are generated.
          </p>
        </div>
      ) : (
        <div className="print:space-y-8">
          {eventList.map((event: any) => (
            <ExpandableEventCard key={event.id} event={event} halls={halls} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
