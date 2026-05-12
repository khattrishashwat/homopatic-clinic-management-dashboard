import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Calendar, Clock, IndianRupee, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { appointmentsApi, dashboardApi } from "@/services/adminApi";
import { formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/")({
  component: Index,
});

const chartData = [
  { month: "Jan", revenue: 0, appointments: 0 },
  { month: "Feb", revenue: 0, appointments: 0 },
  { month: "Mar", revenue: 0, appointments: 0 },
  { month: "Apr", revenue: 0, appointments: 0 },
  { month: "May", revenue: 0, appointments: 0 },
];

function Index() {
  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.get });
  const appointmentsQuery = useQuery({ queryKey: ["appointments", "dashboard"], queryFn: () => appointmentsApi.list({ limit: 5 }) });
  const appointments = appointmentsQuery.data?.data || [];
  const stats = dashboardQuery.data || {};
  const pendingApprovals = stats.pendingApprovals || appointments.filter((appointment) => appointment.status === "pending").length;
  const onlineCount = appointments.filter((appointment) => appointment.consultation_type === "online").length;
  const offlineCount = Math.max(appointments.length - onlineCount, 0);
  const modeData = [
    { name: "Online", value: appointments.length ? Math.round((onlineCount / appointments.length) * 100) : 0, fill: "var(--color-chart-1)" },
    { name: "Offline", value: appointments.length ? Math.round((offlineCount / appointments.length) * 100) : 0, fill: "var(--color-chart-2)" },
  ];
  const statCards = [
    { title: "Total Appointments", value: stats.totalAppointments || 0, icon: Calendar, note: "Live", color: "text-primary" },
    { title: "Total Slots", value: stats.totalSlots || 0, icon: Clock, note: "Configured", color: "text-info" },
    { title: "Pending Approvals", value: pendingApprovals, icon: Activity, note: "Recent page", color: "text-warning-foreground" },
    { title: "Active Patients", value: stats.activePatients || 0, icon: Users, note: "Registered", color: "text-success" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back. Here's your clinic overview.</p>
        </div>
        <Button size="sm">
          <Calendar className="mr-1.5 h-4 w-4" />
          Today: May 7, 2026
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                  <span className="text-xs text-muted-foreground">{stat.note}</span>
                </div>
                <div className={`rounded-xl bg-primary/10 p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
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
              <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
              <div className="flex items-center gap-1 text-sm">
                <IndianRupee className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(stats.totalRevenue || 0)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.12} strokeWidth={2} />
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
                <Tooltip />
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Appointments Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Bar dataKey="appointments" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointmentsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading appointments...</p>}
            {appointments.map((appointment) => (
              <div key={appointment._id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{appointment.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(appointment.slot?.startTime)} at {formatTime(appointment.slot?.startTime)}
                  </p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
            {!appointmentsQuery.isLoading && appointments.length === 0 && <p className="text-sm text-muted-foreground">No appointments found</p>}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
