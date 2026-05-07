import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Eye, Check, X, Clock, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { mockAppointments, type Appointment } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_dashboard/appointments")({
  component: AppointmentsPage,
});

const statusFilters = ["all", "pending", "approved", "completed", "missed", "rescheduled"] as const;
const modeFilters = ["all", "online", "offline"] as const;

function AppointmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [appointments, setAppointments] = useState(mockAppointments);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const filtered = appointments.filter((a) => {
    const matchSearch = a.patientName.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchMode = modeFilter === "all" || a.mode === modeFilter;
    return matchSearch && matchStatus && matchMode;
  });

  const updateStatus = (id: string, status: Appointment["status"]) => {
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setSelectedApt(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm text-muted-foreground">Manage all patient appointments</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusFilters.map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize text-xs">
                  {s}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {modeFilters.map((m) => (
                <Button key={m} size="sm" variant={modeFilter === m ? "default" : "outline"} onClick={() => setModeFilter(m)} className="capitalize text-xs">
                  {m}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((apt) => (
                  <tr key={apt.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{apt.id}</td>
                    <td className="px-4 py-3 font-medium">{apt.patientName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{apt.date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{apt.time}</td>
                    <td className="px-4 py-3"><StatusBadge status={apt.mode} /></td>
                    <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={apt.paymentStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedApt(apt)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {apt.status === "pending" && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-success hover:text-success" onClick={() => updateStatus(apt.id, "approved")}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => updateStatus(apt.id, "rejected")}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No appointments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>Details for appointment {selectedApt?.id}</DialogDescription>
          </DialogHeader>
          {selectedApt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Patient</p>
                  <p className="font-medium">{selectedApt.patientName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Problem</p>
                  <p className="font-medium">{selectedApt.problem}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{selectedApt.date} at {selectedApt.time}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mode</p>
                  <StatusBadge status={selectedApt.mode} />
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <StatusBadge status={selectedApt.status} />
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <StatusBadge status={selectedApt.paymentStatus} />
                </div>
              </div>
              {selectedApt.notes && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="text-muted-foreground mb-1">Notes</p>
                  <p>{selectedApt.notes}</p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                {selectedApt.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedApt.id, "approved")}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedApt.id, "rejected")}>
                      <X className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </>
                )}
                {selectedApt.status === "approved" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedApt.id, "completed")}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Mark Completed
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedApt.id, "missed")}>
                      <Clock className="h-3.5 w-3.5 mr-1" /> Mark Missed
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedApt.id, "rescheduled")}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reschedule
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}