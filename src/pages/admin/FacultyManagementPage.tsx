import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, UserCircle, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function FacultyManagementPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  // Queries
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/departments`);
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });

  const { data: faculty, isLoading } = useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/faculty`);
      if (!res.ok) throw new Error("Failed to fetch faculty");
      return res.json();
    },
  });

  // Mutations
  const addFacultyMutation = useMutation({
    mutationFn: async (newFac: { name: string; email: string; department_id: string }) => {
      const res = await fetch(`${API_URL}/faculty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFac),
      });
      if (!res.ok) throw new Error("Failed to add faculty");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      toast.success("Faculty added successfully");
      setIsDialogOpen(false);
      setName("");
      setEmail("");
      setDepartmentId("");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteFacultyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/faculty/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete faculty");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      toast.success("Faculty removed");
    },
    onError: (error) => toast.error(error.message),
  });

  const resetLoginMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/faculty/${id}/reset-login`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset login");
      return data;
    },
    onSuccess: (data) => toast.success(data.message || "Login reset successfully"),
    onError: (error: any) => toast.error(error.message),
  });

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage invigilators and faculty members.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Faculty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Faculty</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Dr. Jane Fisher"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane.fisher@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => addFacultyMutation.mutate({ name, email, department_id: departmentId })}
                disabled={!name || !email || !departmentId || addFacultyMutation.isPending}
              >
                Save Faculty
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : faculty?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <UserCircle className="h-12 w-12 text-muted-foreground/50" />
                    <p>No faculty members found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              faculty?.map((fac: any) => (
                <TableRow key={fac.id}>
                  <TableCell className="font-medium">{fac.name}</TableCell>
                  <TableCell>{fac.email}</TableCell>
                  <TableCell>{fac.department_name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Reset login (re-enable Faculty@2026 password)"
                        onClick={() => resetLoginMutation.mutate(fac.id)}
                        disabled={resetLoginMutation.isPending}
                      >
                        {resetLoginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-blue-500" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to remove this faculty member?")) {
                            deleteFacultyMutation.mutate(fac.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
