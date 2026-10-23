import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Calendar, Clock, IndianRupee, ShoppingBag, Users, RotateCcw } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { appointmentsApi, dashboardApi } from "@/services/adminApi";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/")({
  component: Index,
});

type DatePreset = "all" | "today" | "week" | "month" | "custom";

function Index() {
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const getDateRange = () => {
    const now = new Date();
    if (preset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      return { startDate: todayStr, endDate: todayStr };
    }
    if (preset === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: weekAgo.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] };
    }
    if (preset === "month") {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return { startDate: monthAgo.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] };
    }
    if (preset === "custom") {
      return {
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
      };
    }
    return {};
  };

  const dateParams = getDateRange();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", dateParams],
    queryFn: () => dashboardApi.get(dateParams),
  });

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "dashboard", dateParams],
    queryFn: () => appointmentsApi.list({ ...dateParams, limit: 5 }),
  });

  const appointments = appointmentsQuery.data?.data || [];
  const stats = dashboardQuery.data || {
    totalAppointments: 0,
    totalSlots: 0,
    activePatients: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
  };

  const pendingApprovals =
    stats.pendingApprovals !== undefined
      ? stats.pendingApprovals
      : appointments.filter((appointment) => appointment.status === "pending").length;

  const onlineCount = stats.onlineCount !== undefined
    ? stats.onlineCount
    : appointments.filter((a) => (a.consultation_type || a.bookingType || "").toLowerCase() === "online").length;

  const offlineCount = stats.offlineCount !== undefined
    ? stats.offlineCount
    : Math.max((stats.totalAppointments || appointments.length) - onlineCount, 0);

  const totalModeCount = onlineCount + offlineCount;
  const modeData = [
    {
      name: "Online",
      value: totalModeCount ? Math.round((onlineCount / totalModeCount) * 100) : 0,
      fill: "var(--color-chart-1, #0284c7)",
    },
    {
      name: "Offline",
      value: totalModeCount ? Math.round((offlineCount / totalModeCount) * 100) : 0,
      fill: "var(--color-chart-2, #10b981)",
    },
  ];

  const chartData = stats.monthlyTrends && stats.monthlyTrends.length > 0
    ? stats.monthlyTrends
    : [
        { month: "May", revenue: 0, appointments: 0 },
        { month: "Jun", revenue: 0, appointments: 0 },
        { month: "Jul", revenue: 0, appointments: 0 },
        { month: "Aug", revenue: 0, appointments: 0 },
        { month: "Sep", revenue: 0, appointments: 0 },
        { month: "Oct", revenue: 0, appointments: 0 },
      ];

  const statCards = [
    { title: "Total Appointments", value: stats.totalAppointments || 0, icon: Calendar, note: preset === "all" ? "All Time" : "In range", color: "text-primary" },
    { title: "Total Revenue", value: formatCurrency(stats.totalRevenue || 0), icon: IndianRupee, isFormatted: true, note: "Captured payments", color: "text-emerald-600" },
    { title: "Total Orders", value: stats.totalOrders !== undefined ? stats.totalOrders : 0, icon: ShoppingBag, note: "Product orders", color: "text-sky-600" },
    { title: "Pending Approvals", value: pendingApprovals, icon: Activity, note: "Awaiting action", color: "text-amber-600" },
    { title: "Active Patients", value: stats.activePatients || 0, icon: Users, note: "Registered", color: "text-success" },
    { title: "Available Slots", value: stats.totalSlots || 0, icon: Clock, note: "Configured", color: "text-info" },
  ];

  const currentDisplayDate = formatDate(stats.serverDate || new Date());

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back. Real-time clinic performance & operations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card text-xs font-medium text-foreground shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Today: {currentDisplayDate}</span>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium text-muted-foreground mr-1">Period:</span>
              <Button
                size="sm"
                variant={preset === "all" ? "default" : "outline"}
                className="h-7 text-xs px-2.5"
                onClick={() => setPreset("all")}
              >
                All Time
              </Button>
              <Button
                size="sm"
                variant={preset === "today" ? "default" : "outline"}
                className="h-7 text-xs px-2.5"
                onClick={() => setPreset("today")}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant={preset === "week" ? "default" : "outline"}
                className="h-7 text-xs px-2.5"
                onClick={() => setPreset("week")}
              >
                Last 7 Days
              </Button>
              <Button
                size="sm"
                variant={preset === "month" ? "default" : "outline"}
                className="h-7 text-xs px-2.5"
                onClick={() => setPreset("month")}
              >
                Last 30 Days
              </Button>
              <Button
                size="sm"
                variant={preset === "custom" ? "default" : "outline"}
                className="h-7 text-xs px-2.5"
                onClick={() => setPreset("custom")}
              >
                Custom Range
              </Button>
            </div>

            {preset === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  className="h-7 w-36 text-xs"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  className="h-7 w-36 text-xs"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
                {(customStart || customEnd) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title="Reset custom dates"
                    onClick={() => {
                      setCustomStart("");
                      setCustomEnd("");
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold text-foreground">
                    {stat.isFormatted ? stat.value : typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <span className="text-[10px] text-muted-foreground">{stat.note}</span>
                </div>
                <div className={`rounded-xl bg-primary/10 p-2 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Revenue Trend (Recent Months)</CardTitle>
              <div className="flex items-center gap-1 text-sm">
                <IndianRupee className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">{formatCurrency(stats.totalRevenue || 0)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Consultation Mode</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={modeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                  {modeData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-6">
              {modeData.map((mode) => (
                <div key={mode.name} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ background: mode.fill }} />
                  <span className="text-muted-foreground">{mode.name}</span>
                  <span className="font-semibold">{mode.value}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Online: {onlineCount} | Offline: {offlineCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Appointments Trend (Recent Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip formatter={(val: any) => [val, "Appointments"]} />
                <Bar dataKey="appointments" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointmentsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading appointments...</p>}
            {appointments.map((appointment) => {
              const aptDate = appointment.appointmentDate || appointment.slot?.startTime || appointment.createdAt;
              const aptTime = appointment.appointmentTime || (appointment.slot?.startTime ? formatTime(appointment.slot.startTime) : null);
              return (
                <div key={appointment._id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{appointment.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(aptDate)}{aptTime ? ` at ${aptTime}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              );
            })}
            {!appointmentsQuery.isLoading && appointments.length === 0 && (
              <p className="text-sm text-muted-foreground">No appointments found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
