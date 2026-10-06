import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Clock, Eye, Search, X, MapPin, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { appointmentsApi, type AppointmentDto } from "@/services/adminApi";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/appointments")({
  component: AppointmentsPage,
});

const statusFilters = ["all", "pending", "confirmed", "completed", "missed", "rejected"] as const;
const modeFilters = ["all", "online", "offline"] as const;
const planFilters = [
  { id: "all", label: "All Plans" },
  { id: "SEVEN_DAYS", label: "7 Days" },
  { id: "ONE_MONTH", label: "1 Month" },
] as const;

function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedApt, setSelectedApt] = useState<AppointmentDto | null>(null);

  const params = {
    status: statusFilter === "all" ? undefined : statusFilter,
    consultation_type: modeFilter === "all" ? undefined : modeFilter,
    bookingType: modeFilter === "all" ? undefined : modeFilter.toUpperCase(),
    planType: planFilter === "all" ? undefined : planFilter,
    limit: 50,
  };

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", params],
    queryFn: () => appointmentsApi.list(params),
  });

  const appointments = appointmentsQuery.data?.data || [];
  const filtered = appointments.filter((appointment) => {
    const term = search.toLowerCase();
    const matchesSearch =
      appointment.patientName.toLowerCase().includes(term) ||
      appointment._id.toLowerCase().includes(term) ||
      (appointment.patientPhone && appointment.patientPhone.includes(term));

    if (!matchesSearch) return false;

    if (planFilter !== "all") {
      const plan = appointment.planType;
      if (planFilter === "SEVEN_DAYS" && plan !== "SEVEN_DAYS") return false;
      if (planFilter === "ONE_MONTH" && plan !== "ONE_MONTH") return false;
    }

    return true;
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      status === "completed"
        ? appointmentsApi.complete(id)
        : status === "missed"
        ? appointmentsApi.missed(id)
        : appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Appointment updated");
      setSelectedApt(null);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update status");
    },
  });

  const updateStatus = (id: string, status: string) => statusMutation.mutate({ id, status });

  const getPlanBadge = (appointment: AppointmentDto) => {
    const isOnline = (appointment.bookingType || appointment.consultation_type || "").toUpperCase() === "ONLINE";
    if (!isOnline) return <span className="text-muted-foreground">—</span>;

    const plan = appointment.planType;
    if (plan === "SEVEN_DAYS") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
          7 Days
        </span>
      );
    }
    if (plan === "ONE_MONTH") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          1 Month
        </span>
      );
    }
    return <span className="text-xs text-muted-foreground">{plan || "Plan"}</span>;
  };

  const getAmount = (apt: AppointmentDto) => {
    const amt = apt.totalAmount ?? apt.amount;
    if (amt !== undefined) return formatCurrency(amt);
    const isOnline = (apt.bookingType || apt.consultation_type || "").toUpperCase() === "ONLINE";
    return isOnline ? formatCurrency(500) : formatCurrency(200);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-sm text-muted-foreground">Manage all patient appointments, plans, and payments</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, phone, or ID..."
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  className="capitalize text-xs"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Booking Type:</span>
              <div className="flex gap-1.5">
                {modeFilters.map((mode) => (
                  <Button
                    key={mode}
                    size="sm"
                    variant={modeFilter === mode ? "default" : "outline"}
                    onClick={() => setModeFilter(mode)}
                    className="capitalize text-xs h-8"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Online Plan:</span>
              <div className="flex gap-1.5">
                {planFilters.map((pf) => (
                  <Button
                    key={pf.id}
                    size="sm"
                    variant={planFilter === pf.id ? "default" : "outline"}
                    onClick={() => setPlanFilter(pf.id)}
                    className="text-xs h-8"
                  >
                    {pf.label}
                  </Button>
                ))}
              </div>
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
                  {[
                    "ID",
                    "Customer",
                    "Booking Type",
                    "Plan",
                    "Appointment Date",
                    "Time",
                    "Amount",
                    "Payment Status",
                    "Booking Status",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointmentsQuery.isLoading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      Loading appointments...
                    </td>
                  </tr>
                )}
                {filtered.map((appointment) => {
                  const isOnline = (appointment.bookingType || appointment.consultation_type || "").toUpperCase() === "ONLINE";
                  return (
                    <tr key={appointment._id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{appointment._id.slice(-8)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{appointment.patientName}</div>
                        {appointment.patientPhone && (
                          <div className="text-xs text-muted-foreground">{appointment.patientPhone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                            isOnline
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          )}
                        >
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{getPlanBadge(appointment)}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(appointment.slot?.startTime)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatTime(appointment.slot?.startTime)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                        {getAmount(appointment)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={appointment.payment_status || "pending"} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setSelectedApt(appointment)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {appointment.status === "pending" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                disabled={statusMutation.isPending}
                                onClick={() => updateStatus(appointment._id, "confirmed")}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                disabled={statusMutation.isPending}
                                onClick={() => updateStatus(appointment._id, "rejected")}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!appointmentsQuery.isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      No appointments found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>Details for appointment #{selectedApt?._id.slice(-8).toUpperCase()}</DialogDescription>
          </DialogHeader>
          {selectedApt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/40 p-4 rounded-xl border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Patient Name</p>
                  <p className="font-semibold text-foreground">{selectedApt.patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-medium text-foreground">{selectedApt.patientPhone || selectedApt.patientEmail || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Health Concern</p>
                  <p className="font-medium text-foreground">{selectedApt.concern || selectedApt.reason || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date & Time</p>
                  <p className="font-medium text-foreground">
                    {formatDate(selectedApt.slot?.startTime)} at {formatTime(selectedApt.slot?.startTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Booking Type</p>
                  <span className="font-semibold capitalize">
                    {selectedApt.bookingType || selectedApt.consultation_type || "Offline"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subscription Plan</p>
                  <p className="font-semibold text-foreground">
                    {selectedApt.planType === "SEVEN_DAYS"
                      ? "7 Days Plan"
                      : selectedApt.planType === "ONE_MONTH"
                      ? "1 Month Plan"
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    {getAmount(selectedApt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Delivery Charges</p>
                  <p className="font-medium text-foreground">
                    {(selectedApt.bookingType || selectedApt.consultation_type || "").toUpperCase() === "ONLINE"
                      ? "Included in Plan"
                      : "Not Applicable"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Status</p>
                  <StatusBadge status={selectedApt.payment_status || "pending"} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Booking Status</p>
                  <StatusBadge status={selectedApt.status} />
                </div>
              </div>

              {selectedApt.address && (
                <div className="rounded-lg bg-muted/30 p-3 text-sm border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Delivery Address
                  </p>
                  <p className="text-foreground">
                    {selectedApt.address}
                    {selectedApt.city ? `, ${selectedApt.city}` : ""}
                    {selectedApt.pincode ? ` - ${selectedApt.pincode}` : ""}
                  </p>
                </div>
              )}

              {selectedApt.notes && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="mb-1 text-xs text-muted-foreground font-semibold">Notes</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedApt.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                {selectedApt.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(selectedApt._id, "confirmed")}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedApt._id, "rejected")}>
                      <X className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {selectedApt.status === "confirmed" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(selectedApt._id, "completed")}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="mr-1 h-3.5 w-3.5" /> Mark Completed
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedApt._id, "missed")}>
                      <Clock className="mr-1 h-3.5 w-3.5" /> Mark Missed
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
