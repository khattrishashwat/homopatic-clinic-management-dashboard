import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Ban,
  Calendar,
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Video,
  Building2,
  AlertCircle,
  CheckCircle2,
  CalendarX,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import {
  slotsApi,
  type BookingScheduleDto,
  type DayScheduleDto,
  type DateOverrideDto,
  type TimeRangeDto,
} from "@/services/adminApi";
import { formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/slots")({
  component: AdvancedSlotsPage,
});

const DAYS_OF_WEEK = [
  { day: 1, name: "Monday" },
  { day: 2, name: "Tuesday" },
  { day: 3, name: "Wednesday" },
  { day: 4, name: "Thursday" },
  { day: 5, name: "Friday" },
  { day: 6, name: "Saturday" },
  { day: 0, name: "Sunday" },
];

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function checkRangesOverlap(ranges: TimeRangeDto[]): string | null {
  for (let i = 0; i < ranges.length; i++) {
    const s = timeToMins(ranges[i].startTime);
    const e = timeToMins(ranges[i].endTime);
    if (s >= e) {
      return `Start time (${ranges[i].startTime}) must be earlier than end time (${ranges[i].endTime}).`;
    }
  }

  const sorted = [...ranges].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (timeToMins(sorted[i].endTime) > timeToMins(sorted[i + 1].startTime)) {
      return `Time ranges cannot overlap: ${sorted[i].startTime}–${sorted[i].endTime} and ${sorted[i + 1].startTime}–${sorted[i + 1].endTime}.`;
    }
  }
  return null;
}

function AdvancedSlotsPage() {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<"online" | "offline" | "slots">("online");
  const [activeLevel, setActiveLevel] = useState<"weekly" | "specific" | "default">("weekly");

  // Schedule Query for current type
  const currentType = mainTab === "offline" ? "offline" : "online";
  const scheduleQuery = useQuery({
    queryKey: ["schedule", currentType],
    queryFn: () => slotsApi.getSchedule(currentType),
    enabled: mainTab === "online" || mainTab === "offline",
  });

  // Local draft state for schedule
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [weeklySchedule, setWeeklySchedule] = useState<DayScheduleDto[]>([]);
  const [defaultSchedule, setDefaultSchedule] = useState<{ enabled: boolean; timeRanges: TimeRangeDto[] }>({
    enabled: true,
    timeRanges: [{ startTime: "10:00", endTime: "18:00" }],
  });
  const [dateOverrides, setDateOverrides] = useState<DateOverrideDto[]>([]);

  // Specific Date Form
  const [overrideDate, setOverrideDate] = useState<string>("");
  const [overrideIsClosed, setOverrideIsClosed] = useState<boolean>(false);
  const [overrideRanges, setOverrideRanges] = useState<TimeRangeDto[]>([{ startTime: "10:00", endTime: "14:00" }]);
  const [overrideNote, setOverrideNote] = useState<string>("");

  // Preview State
  const [previewDate, setPreviewDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const previewQuery = useQuery({
    queryKey: ["preview-slots", currentType, previewDate],
    queryFn: () => slotsApi.previewSlots(currentType, previewDate),
    enabled: !!previewDate && (mainTab === "online" || mainTab === "offline"),
  });

  // Slots List Query
  const slotsQuery = useQuery({ queryKey: ["slots"], queryFn: slotsApi.list, enabled: mainTab === "slots" });
  const [slotView, setSlotView] = useState<"calendar" | "table">("calendar");

  // Sync draft when schedule data arrives or tab changes
  useEffect(() => {
    if (scheduleQuery.data) {
      setSlotDuration(scheduleQuery.data.slotDuration || 30);
      setDefaultSchedule(
        scheduleQuery.data.defaultSchedule || {
          enabled: true,
          timeRanges: [{ startTime: "10:00", endTime: "18:00" }],
        }
      );
      setWeeklySchedule(scheduleQuery.data.weeklySchedule || []);
      setDateOverrides(scheduleQuery.data.dateOverrides || []);
    }
  }, [scheduleQuery.data]);

  // Mutations
  const updateScheduleMutation = useMutation({
    mutationFn: (data: Partial<BookingScheduleDto>) => slotsApi.updateSchedule(currentType, data),
    onSuccess: (updated) => {
      toast.success(`${currentType.toUpperCase()} schedule saved successfully`);
      queryClient.setQueryData(["schedule", currentType], updated);
      queryClient.invalidateQueries({ queryKey: ["preview-slots"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to save schedule");
    },
  });

  const slotToggleMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => slotsApi.update(id, { available }),
    onSuccess: () => {
      toast.success("Slot availability updated");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });

  // Time Range Helpers for Weekly Schedule
  const handleToggleDay = (dayNum: number, enabled: boolean) => {
    setWeeklySchedule((prev) => {
      const idx = prev.findIndex((d) => d.dayOfWeek === dayNum);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], enabled };
        return copy;
      }
      return [...prev, { dayOfWeek: dayNum, enabled, timeRanges: [{ startTime: "10:00", endTime: "18:00" }] }];
    });
  };

  const handleAddRangeToDay = (dayNum: number) => {
    setWeeklySchedule((prev) => {
      const idx = prev.findIndex((d) => d.dayOfWeek === dayNum);
      if (idx >= 0) {
        const copy = [...prev];
        const ranges = copy[idx].timeRanges || [];
        copy[idx] = {
          ...copy[idx],
          timeRanges: [...ranges, { startTime: "14:00", endTime: "18:00" }],
        };
        return copy;
      }
      return [...prev, { dayOfWeek: dayNum, enabled: true, timeRanges: [{ startTime: "10:00", endTime: "18:00" }] }];
    });
  };

  const handleRemoveRangeFromDay = (dayNum: number, rangeIdx: number) => {
    setWeeklySchedule((prev) => {
      const idx = prev.findIndex((d) => d.dayOfWeek === dayNum);
      if (idx >= 0) {
        const copy = [...prev];
        const ranges = [...copy[idx].timeRanges];
        ranges.splice(rangeIdx, 1);
        copy[idx] = { ...copy[idx], timeRanges: ranges };
        return copy;
      }
      return prev;
    });
  };

  const handleRangeChange = (dayNum: number, rangeIdx: number, field: "startTime" | "endTime", val: string) => {
    setWeeklySchedule((prev) => {
      const idx = prev.findIndex((d) => d.dayOfWeek === dayNum);
      if (idx >= 0) {
        const copy = [...prev];
        const ranges = [...copy[idx].timeRanges];
        ranges[rangeIdx] = { ...ranges[rangeIdx], [field]: val };
        copy[idx] = { ...copy[idx], timeRanges: ranges };
        return copy;
      }
      return prev;
    });
  };

  // Add Specific Date Override
  const handleAddDateOverride = () => {
    if (!overrideDate) {
      toast.error("Please pick a date for the override.");
      return;
    }
    if (!overrideIsClosed) {
      const err = checkRangesOverlap(overrideRanges);
      if (err) {
        toast.error(err);
        return;
      }
    }

    const newOverride: DateOverrideDto = {
      date: overrideDate,
      isClosed: overrideIsClosed,
      timeRanges: overrideIsClosed ? [] : overrideRanges,
      note: overrideNote,
    };

    setDateOverrides((prev) => {
      const filtered = prev.filter((o) => o.date !== overrideDate);
      return [...filtered, newOverride].sort((a, b) => a.date.localeCompare(b.date));
    });

    setOverrideDate("");
    setOverrideNote("");
    setOverrideIsClosed(false);
    toast.success(`Date override added for ${overrideDate}. Remember to click Save.`);
  };

  const handleRemoveDateOverride = (date: string) => {
    setDateOverrides((prev) => prev.filter((o) => o.date !== date));
    toast.info(`Removed override for ${date}. Click Save to persist.`);
  };

  // Save Validation & Submission
  const handleSaveSchedule = () => {
    // 1. Duration check (15 - 35 mins)
    if (slotDuration < 15 || slotDuration > 35) {
      toast.error("Slot duration must be between 15 and 35 minutes.");
      return;
    }

    // 2. Validate Weekly Ranges
    for (const day of weeklySchedule) {
      if (day.enabled && day.timeRanges?.length) {
        const err = checkRangesOverlap(day.timeRanges);
        if (err) {
          const dayName = DAYS_OF_WEEK.find((d) => d.day === day.dayOfWeek)?.name || `Day ${day.dayOfWeek}`;
          toast.error(`${dayName}: ${err}`);
          return;
        }
      }
    }

    // 3. Validate Default Ranges
    if (defaultSchedule.enabled && defaultSchedule.timeRanges?.length) {
      const err = checkRangesOverlap(defaultSchedule.timeRanges);
      if (err) {
        toast.error(`Default Schedule: ${err}`);
        return;
      }
    }

    // Submit payload
    updateScheduleMutation.mutate({
      bookingType: currentType,
      slotDuration,
      defaultSchedule,
      weeklySchedule,
      dateOverrides,
    });
  };

  const handleReset = () => {
    if (scheduleQuery.data) {
      setSlotDuration(scheduleQuery.data.slotDuration || 30);
      setDefaultSchedule(
        scheduleQuery.data.defaultSchedule || {
          enabled: true,
          timeRanges: [{ startTime: "10:00", endTime: "18:00" }],
        }
      );
      setWeeklySchedule(scheduleQuery.data.weeklySchedule || []);
      setDateOverrides(scheduleQuery.data.dateOverrides || []);
      toast.info("Schedule reset to saved version.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking Time-Slot Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure independent schedules for Online Video & Clinic Visit bookings with multi-level overrides.
          </p>
        </div>

        {mainTab !== "slots" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={updateScheduleMutation.isPending}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
            </Button>
            <Button size="sm" onClick={handleSaveSchedule} disabled={updateScheduleMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" />
              {updateScheduleMutation.isPending ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <Button
          variant={mainTab === "online" ? "default" : "outline"}
          onClick={() => setMainTab("online")}
          className="rounded-xl"
        >
          <Video className="mr-1.5 h-4 w-4" /> Online Booking Schedule
        </Button>
        <Button
          variant={mainTab === "offline" ? "default" : "outline"}
          onClick={() => setMainTab("offline")}
          className="rounded-xl"
        >
          <Building2 className="mr-1.5 h-4 w-4" /> Offline (Clinic Visit) Schedule
        </Button>
        <Button
          variant={mainTab === "slots" ? "default" : "ghost"}
          onClick={() => setMainTab("slots")}
          className="rounded-xl ml-auto"
        >
          <CalendarDays className="mr-1.5 h-4 w-4" /> View Generated Slots
        </Button>
      </div>

      {/* SECTION A & B: ONLINE / OFFLINE SCHEDULE CONFIGURATION */}
      {(mainTab === "online" || mainTab === "offline") && (
        <div className="space-y-6">
          {/* Duration Card */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Slot Duration Rules ({currentType.toUpperCase()})
                  </CardTitle>
                  <CardDescription>
                    Duration for each individual consultation appointment slot. Allowed: 15 to 35 minutes.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {[15, 20, 25, 30, 35].map((d) => (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant={slotDuration === d ? "default" : "outline"}
                        onClick={() => setSlotDuration(d)}
                        className="h-8 px-2.5 text-xs rounded-lg"
                      >
                        {d}m
                      </Button>
                    ))}
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min={15}
                      max={35}
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(Number(e.target.value))}
                      className="h-8 text-center text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            {(slotDuration < 15 || slotDuration > 35) && (
              <CardContent className="pt-0">
                <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Slot duration must be between 15 and 35 minutes.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Level Switcher */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeLevel === "weekly" ? "default" : "outline"}
              onClick={() => setActiveLevel("weekly")}
              className="rounded-lg text-xs"
            >
              1. Weekly Schedule (Mon–Sun)
            </Button>
            <Button
              size="sm"
              variant={activeLevel === "specific" ? "default" : "outline"}
              onClick={() => setActiveLevel("specific")}
              className="rounded-lg text-xs"
            >
              2. Specific Date Overrides ({dateOverrides.length})
            </Button>
            <Button
              size="sm"
              variant={activeLevel === "default" ? "default" : "outline"}
              onClick={() => setActiveLevel("default")}
              className="rounded-lg text-xs"
            >
              3. Default Fallback Schedule
            </Button>
          </div>

          {/* LEVEL 1: WEEKLY SCHEDULE */}
          {activeLevel === "weekly" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {DAYS_OF_WEEK.map(({ day, name }) => {
                const dayConfig = weeklySchedule.find((d) => d.dayOfWeek === day) || {
                  dayOfWeek: day,
                  enabled: false,
                  timeRanges: [],
                };
                const ranges = dayConfig.timeRanges || [];

                return (
                  <Card key={day} className={`transition-all ${dayConfig.enabled ? "border-border shadow-sm" : "opacity-60 bg-muted/20"}`}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base">{name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{dayConfig.enabled ? "Open" : "Closed"}</span>
                          <Switch
                            checked={dayConfig.enabled}
                            onCheckedChange={(checked) => handleToggleDay(day, checked)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3">
                      {dayConfig.enabled ? (
                        <>
                          {ranges.map((r, rIdx) => (
                            <div key={rIdx} className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg border text-xs">
                              <Input
                                type="time"
                                value={r.startTime}
                                onChange={(e) => handleRangeChange(day, rIdx, "startTime", e.target.value)}
                                className="h-7 px-2 text-xs"
                              />
                              <span className="text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={r.endTime}
                                onChange={(e) => handleRangeChange(day, rIdx, "endTime", e.target.value)}
                                className="h-7 px-2 text-xs"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => handleRemoveRangeFromDay(day, rIdx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-7 border-dashed"
                            onClick={() => handleAddRangeToDay(day)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Add Time Range
                          </Button>
                        </>
                      ) : (
                        <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                          <CalendarX className="h-4 w-4" /> Closed on this day
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* LEVEL 2: SPECIFIC DATE OVERRIDES */}
          {activeLevel === "specific" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Add Date Override
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Overrides normal weekly schedule for a single chosen calendar date.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <Label className="text-xs font-semibold">Select Date</Label>
                    <Input
                      type="date"
                      value={overrideDate}
                      onChange={(e) => setOverrideDate(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border">
                    <div>
                      <div className="font-semibold text-xs">Mark as Closed / Holiday</div>
                      <div className="text-[10px] text-muted-foreground">Blocks all bookings for this day</div>
                    </div>
                    <Switch checked={overrideIsClosed} onCheckedChange={setOverrideIsClosed} />
                  </div>

                  {!overrideIsClosed && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Time Ranges</Label>
                      {overrideRanges.map((r, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg border text-xs">
                          <Input
                            type="time"
                            value={r.startTime}
                            onChange={(e) => {
                              const copy = [...overrideRanges];
                              copy[rIdx].startTime = e.target.value;
                              setOverrideRanges(copy);
                            }}
                            className="h-7 px-2 text-xs"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={r.endTime}
                            onChange={(e) => {
                              const copy = [...overrideRanges];
                              copy[rIdx].endTime = e.target.value;
                              setOverrideRanges(copy);
                            }}
                            className="h-7 px-2 text-xs"
                          />
                          {overrideRanges.length > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => {
                                const copy = [...overrideRanges];
                                copy.splice(rIdx, 1);
                                setOverrideRanges(copy);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 border-dashed"
                        onClick={() => setOverrideRanges([...overrideRanges, { startTime: "15:00", endTime: "19:00" }])}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add Range
                      </Button>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-semibold">Reason / Note (optional)</Label>
                    <Input
                      placeholder="e.g. Festival holiday / Extended clinic"
                      value={overrideNote}
                      onChange={(e) => setOverrideNote(e.target.value)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>

                  <Button className="w-full" size="sm" onClick={handleAddDateOverride}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add Date Override
                  </Button>
                </CardContent>
              </Card>

              {/* Overrides Table */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Active Date Overrides ({dateOverrides.length})</CardTitle>
                  <CardDescription className="text-xs">
                    These dates take immediate priority over weekly and default schedules.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dateOverrides.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No date overrides configured. Normal weekly schedule will apply on all dates.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="px-3 py-2 text-left font-semibold">Date</th>
                            <th className="px-3 py-2 text-left font-semibold">Status</th>
                            <th className="px-3 py-2 text-left font-semibold">Hours</th>
                            <th className="px-3 py-2 text-left font-semibold">Note</th>
                            <th className="px-3 py-2 text-right font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dateOverrides.map((ov) => (
                            <tr key={ov.date} className="border-b hover:bg-muted/20">
                              <td className="px-3 py-2 font-bold">{ov.date}</td>
                              <td className="px-3 py-2">
                                {ov.isClosed ? (
                                  <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">
                                    Closed
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
                                    Custom Hours
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {ov.isClosed ? (
                                  "-"
                                ) : (
                                  <div className="space-y-0.5">
                                    {ov.timeRanges.map((r, i) => (
                                      <div key={i}>
                                        {r.startTime} – {r.endTime}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{ov.note || "-"}</td>
                              <td className="px-3 py-2 text-right">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRemoveDateOverride(ov.date)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
            </div>
          )}

          {/* LEVEL 3: DEFAULT SCHEDULE */}
          {activeLevel === "default" && (
            <Card className="max-w-2xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Default / Basic Fallback Schedule</CardTitle>
                    <CardDescription className="text-xs">
                      Used whenever a date has no specific override and no day-specific weekly hours.
                    </CardDescription>
                  </div>
                  <Switch
                    checked={defaultSchedule.enabled}
                    onCheckedChange={(checked) => setDefaultSchedule({ ...defaultSchedule, enabled: checked })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {defaultSchedule.enabled ? (
                  <>
                    {defaultSchedule.timeRanges.map((r, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg border text-xs">
                        <Input
                          type="time"
                          value={r.startTime}
                          onChange={(e) => {
                            const copy = [...defaultSchedule.timeRanges];
                            copy[rIdx].startTime = e.target.value;
                            setDefaultSchedule({ ...defaultSchedule, timeRanges: copy });
                          }}
                          className="h-8 px-2 text-xs"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={r.endTime}
                          onChange={(e) => {
                            const copy = [...defaultSchedule.timeRanges];
                            copy[rIdx].endTime = e.target.value;
                            setDefaultSchedule({ ...defaultSchedule, timeRanges: copy });
                          }}
                          className="h-8 px-2 text-xs"
                        />
                        {defaultSchedule.timeRanges.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              const copy = [...defaultSchedule.timeRanges];
                              copy.splice(rIdx, 1);
                              setDefaultSchedule({ ...defaultSchedule, timeRanges: copy });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs border-dashed"
                      onClick={() =>
                        setDefaultSchedule({
                          ...defaultSchedule,
                          timeRanges: [...defaultSchedule.timeRanges, { startTime: "14:00", endTime: "18:00" }],
                        })
                      }
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Time Range
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Default schedule is disabled.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* LIVE PREVIEW BOX */}
          <Card className="bg-leaf-soft/20 border-primary/20 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Live Slot Generation Preview ({currentType.toUpperCase()})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    See exactly which non-overlapping slots patients will see on the website booking page for any date.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Preview Date:</Label>
                  <Input
                    type="date"
                    value={previewDate}
                    onChange={(e) => setPreviewDate(e.target.value)}
                    className="h-8 text-xs w-36 bg-background"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {previewQuery.isLoading && <p className="text-xs text-muted-foreground">Calculating slots...</p>}
              {previewQuery.data && (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="font-semibold text-foreground">Applied Priority Level:</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {previewQuery.data.effective?.level || "DEFAULT"}
                    </span>
                    {previewQuery.data.effective?.isClosed && (
                      <span className="text-destructive font-bold">Clinic Closed on this Date</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(previewQuery.data.slots || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No slots generated for this date (Closed / Unavailable).</p>
                    ) : (
                      previewQuery.data.slots.map((s) => (
                        <div
                          key={s._id || `${s.startTime}-${s.endTime}`}
                          className="px-3 py-1.5 rounded-xl border bg-background text-xs font-semibold shadow-soft flex items-center gap-1.5"
                        >
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECTION C: EXISTING GENERATED SLOTS VIEW */}
      {mainTab === "slots" && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">All Generated Slots ({slotsQuery.data?.length || 0})</CardTitle>
              <CardDescription className="text-xs">
                Inspect all database slots across both Online and Offline bookings.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={slotView === "calendar" ? "default" : "outline"}
                onClick={() => setSlotView("calendar")}
              >
                <CalendarDays className="mr-1 h-3.5 w-3.5" /> Calendar
              </Button>
              <Button
                size="sm"
                variant={slotView === "table" ? "default" : "outline"}
                onClick={() => setSlotView("table")}
              >
                <Clock className="mr-1 h-3.5 w-3.5" /> Table
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {slotsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading slots...</p>}
            {slotView === "calendar" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {(slotsQuery.data || []).map((slot) => (
                  <button
                    key={slot._id}
                    onClick={() => slotToggleMutation.mutate({ id: slot._id, available: !slot.available })}
                    className={`rounded-xl border p-3 text-center text-xs font-medium transition-all ${
                      slot.available
                        ? "border-success/20 bg-success/10 text-success hover:bg-success/20"
                        : "border-destructive/20 bg-destructive/10 text-destructive"
                    }`}
                  >
                    <Clock className="mx-auto mb-1 h-4 w-4" />
                    <div className="font-bold">{formatTime(slot.startTime)}</div>
                    <div className="text-[10px] text-muted-foreground">{formatDate(slot.startTime)}</div>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <span className="uppercase text-[9px] font-bold px-1.5 py-0.5 rounded bg-background/60">
                        {slot.bookingType || "both"}
                      </span>
                      <span className="text-[10px]">{slot.available ? "Open" : "Blocked"}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-3 py-2 text-left font-semibold">Date</th>
                      <th className="px-3 py-2 text-left font-semibold">Time Window</th>
                      <th className="px-3 py-2 text-left font-semibold">Booking Type</th>
                      <th className="px-3 py-2 text-left font-semibold">Status</th>
                      <th className="px-3 py-2 text-right font-semibold">Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(slotsQuery.data || []).map((slot) => (
                      <tr key={slot._id} className="border-b hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{formatDate(slot.startTime)}</td>
                        <td className="px-3 py-2 font-bold">
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </td>
                        <td className="px-3 py-2 uppercase font-semibold text-primary">
                          {slot.bookingType || "both"}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={slot.available ? "available" : "blocked"} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => slotToggleMutation.mutate({ id: slot._id, available: !slot.available })}
                          >
                            {slot.available ? (
                              <>
                                <Ban className="mr-1 h-3.5 w-3.5 text-destructive" /> Block
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-success" /> Unblock
                              </>
                            )}
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
      )}
    </motion.div>
  );
}
