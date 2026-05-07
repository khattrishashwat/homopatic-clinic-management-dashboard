import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, CalendarDays, Ban, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/StatusBadge";

export const Route = createFileRoute("/_dashboard/slots")({
  component: SlotsPage,
});

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 10;
  const min = i % 2 === 0 ? "00" : "30";
  const h12 = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  return { time: `${h12}:${min} ${ampm}`, available: Math.random() > 0.2, booked: Math.random() > 0.6 };
});

const weekDays = ["Saturday, May 9", "Sunday, May 10", "Saturday, May 16", "Sunday, May 17"];
const holidays = [{ date: "2026-06-15", reason: "Eid" }, { date: "2026-08-15", reason: "Independence Day" }];

function SlotsPage() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [slots, setSlots] = useState(timeSlots);
  const [view, setView] = useState<"calendar" | "table">("calendar");

  const toggleBlock = (idx: number) => {
    setSlots((prev) => prev.map((s, i) => i === idx ? { ...s, available: !s.available } : s));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Slot Management</h1>
          <p className="text-sm text-muted-foreground">Weekend slots: Saturday & Sunday, 10 AM – 8 PM</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}>
            <CalendarDays className="h-4 w-4 mr-1" /> Calendar
          </Button>
          <Button size="sm" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>
            <Clock className="h-4 w-4 mr-1" /> Table
          </Button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {weekDays.map((day, i) => (
          <Button key={day} size="sm" variant={selectedDay === i ? "default" : "outline"} onClick={() => setSelectedDay(i)}>
            {day}
          </Button>
        ))}
      </div>

      {/* Slots Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{weekDays[selectedDay]} — Time Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {view === "calendar" ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => toggleBlock(i)}
                  className={`rounded-xl border p-3 text-center transition-all text-sm font-medium
                    ${!slot.available ? "bg-destructive/10 border-destructive/20 text-destructive" :
                      slot.booked ? "bg-primary/10 border-primary/20 text-primary" :
                      "bg-success/10 border-success/20 text-success hover:bg-success/20"}`}
                >
                  <Clock className="h-4 w-4 mx-auto mb-1" />
                  {slot.time}
                  <p className="text-[10px] mt-1">
                    {!slot.available ? "Blocked" : slot.booked ? "Booked" : "Available"}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{slot.time}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={!slot.available ? "blocked" : slot.booked ? "booked" : "available"} />
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => toggleBlock(i)}>
                          {slot.available ? <Ban className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                          {slot.available ? "Block" : "Unblock"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Holidays */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Holiday Management</CardTitle>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Holiday</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {holidays.map((h) => (
              <div key={h.date} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-sm font-medium">{h.reason}</p>
                  <p className="text-xs text-muted-foreground">{h.date}</p>
                </div>
                <Button size="sm" variant="ghost" className="text-destructive">Remove</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}