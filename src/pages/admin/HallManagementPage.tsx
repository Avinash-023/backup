import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Wrench, Loader2 } from "lucide-react";
import { fetchHalls, createHall, deleteHall, type Hall } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function HallManagementPage() {
  const queryClient = useQueryClient();
  const { data: halls = [], isLoading } = useQuery({
    queryKey: ['halls'],
    queryFn: fetchHalls
  });

  const [newHall, setNewHall] = useState({ name: '', rows: 10, cols: 12, status: 'active' as Hall['status'] });

  const createMutation = useMutation({
    mutationFn: createHall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['halls'] });
      setNewHall({ name: '', rows: 10, cols: 12, status: 'active' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHall,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['halls'] })
  });

  const addHall = async () => {
    if (!newHall.name) return;
    createMutation.mutate({
      name: newHall.name,
      building: 'New Block',
      rows: newHall.rows,
      cols: newHall.cols,
      seatsPerBench: 2,
      status: newHall.status,
    });
  };

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-mono flex items-center justify-center gap-2">
      <div className="h-4 w-4 bg-primary rounded-full animate-bounce"></div> Loading halls...
    </div>;
  }

  const totalCapacity = halls.filter(h => h.status === 'active').reduce((s, h) => s + h.totalCapacity, 0);
  const maintenanceCount = halls.filter(h => h.status === 'maintenance').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-primary">Admin / Hall Management</p>
          <h1 className="text-2xl font-bold">Hall Management</h1>
          <p className="text-sm text-muted-foreground">Configure hall layouts and monitor operational status.</p>
        </div>
        <button className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" /> Add New Hall
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Halls', value: halls.length, extra: `+${halls.length > 4 ? halls.length - 4 : 0} this month`, extraColor: 'text-primary' },
          { label: 'Active Capacity', value: totalCapacity.toLocaleString(), extra: 'Seats available', extraColor: 'text-muted-foreground' },
          { label: 'Maintenance Mode', value: maintenanceCount, extra: 'Scheduled repairs', extraColor: 'text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="card-surface p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold tabular-nums">{s.value}</span>
              <span className={`text-xs ${s.extraColor}`}>{s.extra}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/30">
                {['Hall Name', 'Grid Size', 'Total Capacity', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {halls.map((hall) => (
                <tr key={hall.id} className="border-b hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-sm ${hall.status === 'active' ? 'bg-primary/10' : 'bg-warning/10'}`}>
                        {hall.status === 'active' ? <Wrench className="h-4 w-4 text-primary" /> : <Wrench className="h-4 w-4 text-warning" />}
                      </div>
                      <div>
                        <p className="font-medium">{hall.name}</p>
                        <p className="text-xs text-muted-foreground">{hall.building}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{hall.rows} Rows × {hall.cols} Cols</td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className="font-mono">{hall.totalCapacity} Seats</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className={hall.status === 'active' ? 'border-success text-success bg-success/10' : 'border-warning text-warning bg-warning/10'}>
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full inline-block ${hall.status === 'active' ? 'bg-success' : 'bg-warning'}`} />
                      {hall.status === 'active' ? 'Active' : 'Maintenance'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded-sm p-2 hover:bg-secondary transition-colors"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(hall.id)} disabled={deleteMutation.isPending} className="rounded-sm p-2 hover:bg-destructive/10 transition-colors disabled:opacity-50">
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {halls.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No halls found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t text-xs text-muted-foreground">
          <span>Showing {halls.length} of {halls.length} halls</span>
        </div>
      </div>

      {/* Quick Add */}
      <div className="card-surface p-5 max-w-lg">
        <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
          <Plus className="h-4 w-4 text-primary" /> Quick Add Hall
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Hall Name</label>
            <input value={newHall.name} onChange={e => setNewHall({...newHall, name: e.target.value})} placeholder="e.g. Alpha-201" className="mt-1 h-10 w-full rounded-sm border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Status</label>
            <select value={newHall.status} onChange={e => setNewHall({...newHall, status: e.target.value as Hall['status']})} className="mt-1 h-10 w-full rounded-sm border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Row Count</label>
            <input type="number" value={newHall.rows} onChange={e => setNewHall({...newHall, rows: +e.target.value})} className="mt-1 h-10 w-full rounded-sm border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Column Count</label>
            <input type="number" value={newHall.cols} onChange={e => setNewHall({...newHall, cols: +e.target.value})} className="mt-1 h-10 w-full rounded-sm border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
        <button onClick={addHall} disabled={createMutation.isPending} className="mt-4 flex items-center gap-2 rounded-sm bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create Hall
        </button>
      </div>
    </motion.div>
  );
}
