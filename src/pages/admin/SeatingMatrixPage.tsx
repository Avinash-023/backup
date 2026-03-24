import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Hash, Building, RefreshCw } from "lucide-react";
import { fetchHalls, fetchSeatAllocations, fetchSchedules, generateSeatingMatrixApi, type SeatAllocation } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function SeatingMatrixPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(id || '');

  const { data: halls = [], isLoading: hallsLoading } = useQuery({ queryKey: ['halls'], queryFn: fetchHalls });
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({ queryKey: ['schedules'], queryFn: fetchSchedules });
  
  // Set default schedule if none selected
  useEffect(() => {
    if (!selectedScheduleId && schedules.length > 0) {
      setSelectedScheduleId(schedules[0].id);
    }
  }, [schedules, selectedScheduleId]);

  const { data: seats = [], isLoading: seatsLoading } = useQuery({ 
    queryKey: ['allocations', selectedScheduleId], 
    queryFn: () => selectedScheduleId ? fetchSeatAllocations(selectedScheduleId) : Promise.resolve([]),
    enabled: !!selectedScheduleId
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      if (!selectedScheduleId) throw new Error("Select an exam schedule first!");
      return generateSeatingMatrixApi(selectedScheduleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations', selectedScheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      alert('Seating matrix generated successfully!');
    },
    onError: (err: any) => alert(err.message)
  });

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  
  // Find all halls present in allocations
  const allocatedHallIds = Array.from(new Set(seats.map(s => s.hallId).filter(Boolean)));
  // If none allocated yet, show the default scheduled hall or the first one
  const defaultHallId = selectedSchedule?.hallId || halls[0]?.id;
  const displayHallIds = allocatedHallIds.length > 0 ? allocatedHallIds : (defaultHallId ? [defaultHallId] : []);
  
  const displayHalls = displayHallIds.map(hId => halls.find(h => h.id === hId)).filter(Boolean) as any[];

  const [selectedSeat, setSelectedSeat] = useState<SeatAllocation | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [highlightDept, setHighlightDept] = useState(false);

  if (hallsLoading || schedulesLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-mono flex items-center justify-center gap-2">
      <div className="h-4 w-4 bg-primary rounded-full animate-bounce"></div> Loading seating matrix...
    </div>;
  }

  if (displayHalls.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No halls available.</div>;
  }

  const occupiedCount = seats.filter(s => s.status === 'occupied').length;

  const departments = Array.from(new Set(seats.map(s => s.student?.department).filter(Boolean))) as string[];

  const deptColors: Record<string, string> = {};
  const colorPalette = ['#800000', '#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
  departments.forEach((d, i) => { deptColors[d] = colorPalette[i % colorPalette.length]; });


  function getSeatAt(row: number, bench: number, position: 'L' | 'R') {
    return seats.find(s => s.row === row && s.bench === bench && s.position === position);
  }

  function getSeatClasses(seat: SeatAllocation | undefined) {
    if (!seat || seat.status === 'empty') return 'bg-card border border-muted';
    if (seat.status === 'blocked') return 'bg-blocked/10 text-blocked';
    if (seat.status === 'occupied') {
      if (highlightDept && seat.student) return 'text-primary-foreground';
      return 'bg-occupied text-occupied-foreground';
    }
    return 'bg-card border border-muted';
  }

  function getSeatStyle(seat: SeatAllocation | undefined) {
    if (highlightDept && seat?.status === 'occupied' && seat.student) {
      return { backgroundColor: deptColors[seat.student.department] || '#6b7280' };
    }
    return {};
  }

  function isSeatVisible(seat: SeatAllocation | undefined) {
    if (!seat) return true;
    return departmentFilter === 'all' || seat.student?.department === departmentFilter;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Schedule Selector */}
      <div className="card-surface p-4 flex flex-col md:flex-row items-center gap-4 justify-between bg-secondary/5 border-primary/20">
        <div>
          <label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground block mb-1">Select Exam Schedule to Analyze</label>
          <select 
            value={selectedScheduleId} 
            onChange={e => setSelectedScheduleId(e.target.value)} 
            className="h-10 rounded-sm border bg-background px-3 text-sm w-full md:min-w-[300px]"
          >
            {schedules.length === 0 && <option value="">No schedules available</option>}
            {schedules.map(s => (
              <option key={s.id} value={s.id}>
                {s.date} ({s.time}) - {s.subjectName} [{s.subjectCode}]
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => generateMutation.mutate()} 
          disabled={generateMutation.isPending || !selectedScheduleId}
          className="flex items-center gap-2 rounded-sm bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 w-full md:w-auto justify-center"
        >
          <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          Generate New Allocations
        </button>
      </div>

      {seatsLoading ? (
        <div className="p-8 text-center text-muted-foreground animate-pulse font-mono">Loading allocations for this schedule...</div>
      ) : (
      <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Allocations for {selectedSchedule ? `${selectedSchedule.date} — ${selectedSchedule.session}` : 'Selected Exam'}</h1>
          <p className="text-sm text-muted-foreground">
            Spanning {displayHalls.length} Hall(s)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="card-surface px-4 py-2 text-right">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Global Capacity Used</p>
            <p className="text-xl font-bold tabular-nums">{occupiedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Legend */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="h-9 rounded-sm border bg-background px-3 text-sm">
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={highlightDept} onChange={e => setHighlightDept(e.target.checked)} className="rounded" />
            Highlight by Department
          </label>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-occupied" /> Occupied</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border bg-card" /> Empty</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-blocked/20" /> Blocked</span>
        </div>
      </div>

      {/* Allocation info */}
      <div className="card-surface p-3 flex flex-wrap items-center gap-3 text-xs overflow-x-auto">
        <span className="font-semibold text-muted-foreground">Allocation Pattern:</span>
        <span>Column-wise down each physical row</span>
        <span className="text-muted-foreground">|</span>
        <span>Each bench = 2 students from <strong>different departments</strong> globally paired</span>
        <span className="text-muted-foreground">|</span>
        <span className="font-mono">L = Left seat, R = Right seat</span>
      </div>

      <div className="space-y-12">
      {displayHalls.map((h, hIdx) => {
        const hAisles = new Set(h.aisleAfterCol || []);
        
        function getSeatAt(row: number, bench: number, position: 'L' | 'R') {
          return seats.find(s => s.hallId === h.id && s.row === row && s.bench === bench && s.position === position);
        }
        
        const hOccupied = seats.filter(s => s.hallId === h.id && s.status === 'occupied').length;
        const hCap = h.totalCapacity || (h.rows * h.cols * 2);

        return (
          <div key={h.id} className="card-surface p-5 overflow-auto pb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Hall {hIdx + 1}: {h.name}</h2>
              <span className="text-xs font-semibold px-2 py-1 bg-secondary rounded-sm">
                Occupied: {hOccupied} / Min(50, {hCap}) cap
              </span>
            </div>

            {/* Invigilator desk */}
            <div className="mb-6 rounded-sm bg-foreground/90 py-3 text-center text-[10px] font-semibold tracking-[0.2em] uppercase text-background">
              Invigilator Desk / Whiteboard Area
            </div>

            {/* Column/Bench headers */}
            <div className="flex items-end gap-2 mb-2 ml-12">
              {Array.from({ length: h.cols }, (_, bench) => (
                <div key={bench} className="flex flex-col items-center" style={{ marginRight: hAisles.has(bench + 1) ? '24px' : '0' }}>
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">Col {String.fromCharCode(65 + bench)}</span>
                  <div className="flex gap-0.5 text-[8px] text-muted-foreground font-mono">
                    <span className="w-[52px] text-center">L</span>
                    <span className="w-[52px] text-center">R</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {Array.from({ length: h.rows }, (_, row) => (
              <div key={row} className="flex items-center gap-2 mb-2">
                {/* Row label */}
                <div className="w-10 text-right text-[10px] font-semibold text-muted-foreground font-mono">
                  Row {row + 1}
                </div>

                {/* Benches in this row */}
                {Array.from({ length: h.cols }, (_, bench) => {
                  const leftSeat = getSeatAt(row, bench, 'L');
                  const rightSeat = getSeatAt(row, bench, 'R');

                  return (
                    <div
                      key={bench}
                      className="flex gap-0.5"
                      style={{ marginRight: hAisles.has(bench + 1) ? '24px' : '0' }}
                    >
                      {/* Left seat */}
                      <motion.button
                        whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => leftSeat?.status === 'occupied' && setSelectedSeat(leftSeat)}
                        className={`relative flex h-12 w-[52px] flex-col items-center justify-center rounded-l-sm text-[8px] font-mono font-medium transition-colors border ${getSeatClasses(leftSeat)} ${!isSeatVisible(leftSeat) ? 'opacity-20' : ''}`}
                        style={getSeatStyle(leftSeat)}
                        title={leftSeat?.student ? `${leftSeat.student.rollNo} - ${leftSeat.student.name} (${leftSeat.student.department})` : leftSeat?.seatCode || ''}
                      >
                        <span className="font-semibold">{leftSeat?.seatCode}</span>
                        {leftSeat?.student && (
                          <span className="text-[7px] opacity-80 truncate max-w-[48px]">{leftSeat.student.rollNo}</span>
                        )}
                      </motion.button>

                      {/* Right seat */}
                      <motion.button
                        whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => rightSeat?.status === 'occupied' && setSelectedSeat(rightSeat)}
                        className={`relative flex h-12 w-[52px] flex-col items-center justify-center rounded-r-sm text-[8px] font-mono font-medium transition-colors border border-l-0 ${getSeatClasses(rightSeat)} ${!isSeatVisible(rightSeat) ? 'opacity-20' : ''}`}
                        style={getSeatStyle(rightSeat)}
                        title={rightSeat?.student ? `${rightSeat.student.rollNo} - ${rightSeat.student.name} (${rightSeat.student.department})` : rightSeat?.seatCode || ''}
                      >
                        <span className="font-semibold">{rightSeat?.seatCode}</span>
                        {rightSeat?.student && (
                          <span className="text-[7px] opacity-80 truncate max-w-[48px]">{rightSeat.student.rollNo}</span>
                        )}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Door indicator */}
            <div className="mt-6 flex justify-between text-[10px] text-muted-foreground">
              <span>← Entrance</span>
              <span>Exit →</span>
            </div>
          </div>
        );
      })}
      </div>

      {/* Department legend when highlighting */}
      {highlightDept && (
        <div className="flex flex-wrap gap-3 text-xs">
          {departments.map(d => (
            <span key={d} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: deptColors[d] }} />
              {d}
            </span>
          ))}
        </div>
      )}
      </>
      )}

      {/* Seat Detail Modal */}
      <Dialog open={!!selectedSeat} onOpenChange={() => setSelectedSeat(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Seat {selectedSeat?.seatCode}
              <Badge className="bg-occupied text-occupied-foreground">Occupied</Badge>
              <Badge variant="outline" className="font-mono text-xs">
                Bench {selectedSeat ? selectedSeat.bench + 1 : ''} — {selectedSeat?.position === 'L' ? 'Left' : 'Right'}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedSeat?.student && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Student Name</p>
                  <p className="flex items-center gap-2 text-sm font-medium"><User className="h-4 w-4 text-muted-foreground" />{selectedSeat.student.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Roll Number</p>
                  <p className="flex items-center gap-2 text-sm font-mono"><Hash className="h-4 w-4 text-muted-foreground" />{selectedSeat.student.rollNo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Department</p>
                  <p className="flex items-center gap-2 text-sm"><Building className="h-4 w-4 text-muted-foreground" />{selectedSeat.student.department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Subject</p>
                  <p className="text-sm">{selectedSeat.student.subjectCode} - {selectedSeat.student.subjectName}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
