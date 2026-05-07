import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Clock, Eye, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { appointmentsApi, type AppointmentDto } from "@/services/adminApi";
import { formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/appointments")({
  component: AppointmentsPage,
});

const statusFilters = ["all", "pending", "confirmed", "completed", "missed", "rejected"] as const;
const modeFilters = ["all", "online", "offline"] as const;

function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [selectedApt, setSelectedApt] = useState<AppointmentDto | null>(null);
  const params = {
    status: statusFilter === "all" ? undefined : statusFilter,
    consultation_type: modeFilter === "all" ? undefined : modeFilter,
    limit: 50,
  };
  const appointmentsQuery = useQuery({ queryKey: ["appointments", params], queryFn: () => appointmentsApi.list(params) });
  const appointments = appointmentsQuery.data?.data || [];
  const filtered = appointments.filter((appointment) => {
    const term = search.toLowerCase();
    return appointment.patientName.toLowerCase().includes(term) || appointment._id.toLowerCase().includes(term);
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      status === "completed" ? appointmentsApi.complete(id) : status === "missed" ? appointmentsApi.missed(id) : appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Appointment updated");
      setSelectedApt(null);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const updateStatus = (id: string, status: string) => statusMutation.mutate({ id, status });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-sm text-muted-foreground">Manage all patient appointments</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => (
                <Button key={status} size="sm" variant={statusFilter === status ? "default" : "outline"} onClick={() => setStatusFilter(status)} className="capitalize text-xs">
                  {status}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {modeFilters.map((mode) => (
                <Button key={mode} size="sm" variant={modeFilter === mode ? "default" : "outline"} onClick={() => setModeFilter(mode)} className="capitalize text-xs">
                  {mode}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["ID", "Patient", "Date", "Time", "Mode", "Status", "Payment", "Actions"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left font-medium text-muted-foreground">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointmentsQuery.isLoading && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Loading appointments...</td></tr>}
                {filtered.map((appointment) => (
                  <tr key={appointment._id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{appointment._id.slice(-8)}</td>
                    <td className="px-4 py-3 font-medium">{appointment.patientName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(appointment.slot?.startTime)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTime(appointment.slot?.startTime)}</td>
                    <td className="px-4 py-3"><StatusBadge status={appointment.consultation_type || "offline"} /></td>
                    <td className="px-4 py-3"><StatusBadge status={appointment.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={appointment.payment_status || "pending"} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedApt(appointment)}><Eye className="h-3.5 w-3.5" /></Button>
                        {appointment.status === "pending" && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-success" disabled={statusMutation.isPending} onClick={() => updateStatus(appointment._id, "confirmed")}><Check className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={statusMutation.isPending} onClick={() => updateStatus(appointment._id, "rejected")}><X className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!appointmentsQuery.isLoading && filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No appointments found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>Details for appointment {selectedApt?._id.slice(-8)}</DialogDescription>
          </DialogHeader>
          {selectedApt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Patient</p><p className="font-medium">{selectedApt.patientName}</p></div>
                <div><p className="text-muted-foreground">Problem</p><p className="font-medium">{selectedApt.reason || "-"}</p></div>
                <div><p className="text-muted-foreground">Date & Time</p><p className="font-medium">{formatDate(selectedApt.slot?.startTime)} at {formatTime(selectedApt.slot?.startTime)}</p></div>
                <div><p className="text-muted-foreground">Mode</p><StatusBadge status={selectedApt.consultation_type || "offline"} /></div>
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={selectedApt.status} /></div>
                <div><p className="text-muted-foreground">Payment</p><StatusBadge status={selectedApt.payment_status || "pending"} /></div>
              </div>
              {selectedApt.notes && <div className="rounded-lg bg-muted/50 p-3 text-sm"><p className="mb-1 text-muted-foreground">Notes</p><p>{selectedApt.notes}</p></div>}
              <div className="flex justify-end gap-2">
                {selectedApt.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedApt._id, "confirmed")}><Check className="mr-1 h-3.5 w-3.5" /> Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedApt._id, "rejected")}><X className="mr-1 h-3.5 w-3.5" /> Reject</Button>
                  </>
                )}
                {selectedApt.status === "confirmed" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(selectedApt._id, "completed")}><Check className="mr-1 h-3.5 w-3.5" /> Mark Completed</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedApt._id, "missed")}><Clock className="mr-1 h-3.5 w-3.5" /> Mark Missed</Button>
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
