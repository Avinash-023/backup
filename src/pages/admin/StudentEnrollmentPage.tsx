import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, CheckCircle2, Trash2, Database, Loader2 } from "lucide-react";
import { fetchEnrollmentData, bulkUploadEnrollments, clearAllStudents, type EnrollmentRow } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function StudentEnrollmentPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: dbData = [], isLoading } = useQuery({ queryKey: ['enrollments'], queryFn: fetchEnrollmentData });
  const [data, setData] = useState<EnrollmentRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 5;
  
  const displayData = data.length > 0 ? data : dbData;
  const totalPages = Math.ceil(displayData.length / perPage) || 1;
  const pagedData = displayData.slice((page - 1) * perPage, page * perPage);
  const validCount = displayData.filter(d => d.status === 'validated').length;
  const errorCount = displayData.filter(d => d.status === 'error').length;

  const uploadMutation = useMutation({
    mutationFn: bulkUploadEnrollments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      setData([]); // clear data on success
      alert('Upload successful!');
    },
    onError: (err: any) => {
      alert(`Upload failed: ${err.message}`);
    }
  });

  const clearMutation = useMutation({
    mutationFn: clearAllStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      setData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Database cleared successfully!');
    },
    onError: (err: any) => {
      alert(`Clear failed: ${err.message}`);
    }
  });

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      // assume first line is header
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsed = lines.slice(1).map(line => {
        // Simple manual split matching headers
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((h, i) => { row[h.toLowerCase()] = values[i]; });
        
        const rollNo = row['roll no'] || row['rollno'] || values[0];
        const name = row['name'] || values[1];
        const email = row['email'] || values[2];
        const department = row['department'] || values[3];
        
        return {
          rollNo,
          name,
          email,
          department,
          status: (rollNo && name && email && department) ? 'validated' : 'error',
          remarks: (rollNo && name && email && department) ? 'Parsed from CSV' : 'Missing fields'
        } as EnrollmentRow;
      });
      setData(parsed);
      setPage(1);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleCommit = () => {
    const validData = data.filter(d => d.status === 'validated');
    if (validData.length === 0) return;
    uploadMutation.mutate(validData);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-mono flex items-center justify-center gap-2">
      <div className="h-4 w-4 bg-primary rounded-full animate-bounce"></div> Loading enrollments...
    </div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Student Enrollment</h1>
          <p className="text-sm text-muted-foreground">Bulk upload and validate student records</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button 
            onClick={() => {
              if (data.length > 0) {
                setData([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              } else {
                if (window.confirm('Are you sure you want to completely wipe all student data from the database? This action cannot be undone.')) {
                  clearMutation.mutate();
                }
              }
            }} 
            disabled={clearMutation.isPending}
            className="flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
          >
            {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {data.length > 0 ? "Clear Staged Upload" : "Clear Entire Database"}
          </button>
          <button 
            onClick={handleCommit} 
            disabled={uploadMutation.isPending || data.length === 0} 
            className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Commit to Database
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        animate={isDragOver ? { scale: 1.01, borderColor: 'hsl(0, 100%, 25%)' } : { scale: 1 }}
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-16 cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-medium">Click to select or drag and drop to upload CSV files</p>
        <p className="text-xs text-muted-foreground mt-1">Columns: Roll No, Name, Email, Department</p>
      </motion.div>

      {/* Data Table */}
      <AnimatePresence>
        {displayData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card-surface overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-base font-semibold">Data Preview & Validation</h2>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />{validCount} Validated</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" />{errorCount} Errors</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Roll No</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Name</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Email</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Department</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedData.map((row, i) => (
                    <tr key={row.rollNo} className={`border-b transition-colors hover:bg-secondary/20 ${row.status === 'error' ? 'bg-destructive/5' : ''}`}>
                      <td className="px-5 py-3 font-mono text-xs font-medium">{row.rollNo}</td>
                      <td className="px-5 py-3">{row.name}</td>
                      <td className="px-5 py-3 font-mono text-xs">{row.email || '---'}</td>
                      <td className="px-5 py-3">{row.department}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={row.status === 'validated' ? 'border-success text-success bg-success/10' : 'border-destructive text-destructive bg-destructive/10'}>
                          {row.status === 'validated' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                          {row.status === 'validated' ? 'Validated' : 'Error'}
                        </Badge>
                      </td>
                      <td className={`px-5 py-3 text-xs italic ${row.status === 'error' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{row.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t text-xs text-muted-foreground">
              <span>Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, displayData.length)} of {displayData.length} results</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-sm border px-3 py-1 hover:bg-secondary disabled:opacity-50">Previous</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`rounded-sm px-3 py-1 ${page === i + 1 ? 'bg-foreground text-background' : 'border hover:bg-secondary'}`}>{i + 1}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-sm border px-3 py-1 hover:bg-secondary disabled:opacity-50">Next</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
