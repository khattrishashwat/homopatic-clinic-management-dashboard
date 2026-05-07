import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Ban, CalendarDays, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { slotsApi } from "@/services/adminApi";
import { formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/slots")({
  component: SlotsPage,
});

function SlotsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"calendar" | "table">("calendar");
  const slotsQuery = useQuery({ queryKey: ["slots"], queryFn: slotsApi.list });
  const slots = slotsQuery.data || [];
  const updateMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => slotsApi.update(id, { available }),
    onSuccess: () => {
      toast.success("Slot updated");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const generateMutation = useMutation({
    mutationFn: slotsApi.generateWeekends,
    onSuccess: () => {
      toast.success("Weekend slots generated");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold">Slot Management</h1><p className="text-sm text-muted-foreground">Weekend slots and availability</p></div>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}><CalendarDays className="mr-1 h-4 w-4" /> Calendar</Button>
          <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}><Clock className="mr-1 h-4 w-4" /> Table</Button>
          <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}><Plus className="mr-1 h-4 w-4" /> Generate</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Time Slots</CardTitle></CardHeader>
        <CardContent>
          {slotsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading slots...</p>}
          {view === "calendar" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {slots.map((slot) => (
                <button key={slot._id} onClick={() => updateMutation.mutate({ id: slot._id, available: !slot.available })} className={`rounded-xl border p-3 text-center text-sm font-medium transition-all ${slot.available ? "border-success/20 bg-success/10 text-success hover:bg-success/20" : "border-destructive/20 bg-destructive/10 text-destructive"}`}>
                  <Clock className="mx-auto mb-1 h-4 w-4" />
                  {formatTime(slot.startTime)}
                  <p className="mt-1 text-[10px]">{formatDate(slot.startTime)}</p>
                  <p className="mt-1 text-[10px]">{slot.available ? "Available" : "Blocked"}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50"><th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th></tr></thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot._id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">{formatDate(slot.startTime)}</td>
                      <td className="px-4 py-3 font-medium">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</td>
                      <td className="px-4 py-3"><StatusBadge status={slot.available ? "available" : "blocked"} /></td>
                      <td className="px-4 py-3"><Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: slot._id, available: !slot.available })}>{slot.available ? <Ban className="mr-1 h-3.5 w-3.5" /> : <Plus className="mr-1 h-3.5 w-3.5" />}{slot.available ? "Block" : "Unblock"}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!slotsQuery.isLoading && slots.length === 0 && <p className="text-sm text-muted-foreground">No slots found. Generate weekend slots to begin.</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
