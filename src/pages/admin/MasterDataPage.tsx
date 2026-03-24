import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function MasterDataPage() {
  const queryClient = useQueryClient();
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [isSubjDialogOpen, setIsSubjDialogOpen] = useState(false);

  // Form states
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [subjName, setSubjName] = useState("");
  const [subjCode, setSubjCode] = useState("");
  const [subjDeptId, setSubjDeptId] = useState("");

  // Queries
  const { data: departments, isLoading: deptsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/departments`);
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
  });

  const { data: subjects, isLoading: subjsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/subjects`);
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
  });

  // Mutations
  const addDeptMutation = useMutation({
    mutationFn: async (newDept: { name: string; code: string }) => {
      const res = await fetch(`${API_URL}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDept),
      });
      if (!res.ok) throw new Error("Failed to add department");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department added successfully");
      setIsDeptDialogOpen(false);
      setDeptName("");
      setDeptCode("");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/departments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete department");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  const addSubjMutation = useMutation({
    mutationFn: async (newSubj: { name: string; code: string; department_id: string }) => {
      const res = await fetch(`${API_URL}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubj),
      });
      if (!res.ok) throw new Error("Failed to add subject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject added successfully");
      setIsSubjDialogOpen(false);
      setSubjName("");
      setSubjCode("");
      setSubjDeptId("");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteSubjMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
        <p className="text-muted-foreground mt-2">
          Manage departments and subjects for the institution.
        </p>
      </div>

      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Departments</h2>
            <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Department</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deptName">Department Name</Label>
                    <Input
                      id="deptName"
                      placeholder="e.g. Computer Science"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deptCode">Department Code</Label>
                    <Input
                      id="deptCode"
                      placeholder="e.g. CSE"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addDeptMutation.mutate({ name: deptName, code: deptCode })}
                    disabled={!deptName || !deptCode || addDeptMutation.isPending}
                  >
                    Save Department
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptsLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : departments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No departments found
                    </TableCell>
                  </TableRow>
                ) : (
                  departments?.map((dept: any) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.code}</TableCell>
                      <TableCell>{dept.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm("Are you sure?")) {
                              deleteDeptMutation.mutate(dept.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Subjects</h2>
            <Dialog open={isSubjDialogOpen} onOpenChange={setIsSubjDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjCode">Subject Code</Label>
                    <Input
                      id="subjCode"
                      placeholder="e.g. CS101"
                      value={subjCode}
                      onChange={(e) => setSubjCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subjName">Subject Name</Label>
                    <Input
                      id="subjName"
                      placeholder="e.g. Introduction to Programming"
                      value={subjName}
                      onChange={(e) => setSubjName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={subjDeptId} onValueChange={setSubjDeptId}>
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
                    onClick={() => addSubjMutation.mutate({ name: subjName, code: subjCode, department_id: subjDeptId })}
                    disabled={!subjName || !subjCode || !subjDeptId || addSubjMutation.isPending}
                  >
                    Save Subject
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : subjects?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No subjects found
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects?.map((subj: any) => (
                    <TableRow key={subj.id}>
                      <TableCell className="font-medium">{subj.code}</TableCell>
                      <TableCell>{subj.name}</TableCell>
                      <TableCell>{subj.department_code || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm("Are you sure?")) {
                              deleteSubjMutation.mutate(subj.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
