import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { Check, X, AlertTriangle, Users } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  const { data: schedules } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/schedules`);
      if (!res.ok) throw new Error("Failed to fetch schedules");
      const data = await res.json();
      return data.filter((s: any) => s.allocationStatus === "allocated");
    },
  });

  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ["allocations", selectedScheduleId],
    queryFn: async () => {
      if (!selectedScheduleId) return [];
      const res = await fetch(`${API_URL}/allocations/${selectedScheduleId}`);
      if (!res.ok) throw new Error("Failed to fetch allocations");
      return res.json();
    },
    enabled: !!selectedScheduleId,
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${API_URL}/allocations/${id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update attendance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations", selectedScheduleId] });
      toast.success("Attendance updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Present</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "malpractice":
        return <Badge variant="destructive" className="bg-red-700 hover:bg-red-800">Malpractice</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Mark student attendance directly from the invigilator dashboard.
        </p>
      </div>

      <div className="bg-card p-4 rounded-md border flex items-center gap-4">
        <div className="flex-1 max-w-sm space-y-2">
          <Label>Select Exam Schedule</Label>
          <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an allocated schedule..." />
            </SelectTrigger>
            <SelectContent>
              {schedules?.map((sch: any) => (
                <SelectItem key={sch.id} value={sch.id}>
                  {sch.subjectName} ({sch.subjectCode}) - {sch.date} {sch.time}
                </SelectItem>
              ))}
              {schedules?.length === 0 && (
                <SelectItem value="none" disabled>No allocated schedules available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedScheduleId && (
        <div className="rounded-md border bg-card flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seat Code</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Mark Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocationsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading students...</TableCell>
                </TableRow>
              ) : allocations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 mb-[200px]">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Users className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No students allocated for this schedule details.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                allocations?.map((alloc: any) => (
                  <TableRow key={alloc.id}>
                    <TableCell className="font-semibold">{alloc.seatCode}</TableCell>
                    <TableCell>{alloc.student.rollNo}</TableCell>
                    <TableCell>{alloc.student.name}</TableCell>
                    <TableCell>{alloc.student.department}</TableCell>
                    <TableCell>{getStatusBadge(alloc.status)}</TableCell>
                    <TableCell className="text-right">
                      <ToggleGroup 
                        type="single" 
                        value={["present", "absent", "malpractice"].includes(alloc.status) ? alloc.status : ""}
                        onValueChange={(val) => {
                          if (val) updateAttendanceMutation.mutate({ id: alloc.id, status: val });
                        }}
                        className="justify-end"
                      >
                        <ToggleGroupItem value="present" aria-label="Present" className="data-[state=on]:bg-green-100 data-[state=on]:text-green-700">
                          <Check className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="absent" aria-label="Absent" className="data-[state=on]:bg-red-100 data-[state=on]:text-red-700">
                          <X className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="malpractice" aria-label="Malpractice" className="data-[state=on]:bg-red-900 data-[state=on]:text-red-50">
                          <AlertTriangle className="h-4 w-4" />
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
