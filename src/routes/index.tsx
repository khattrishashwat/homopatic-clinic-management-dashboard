import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Users, Clock, TrendingUp, IndianRupee,
  ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import {
  dashboardStats, revenueData, appointmentModeData,
  mockAppointments
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  component: Index,
});

const statCards = [
  { title: "Total Appointments", value: dashboardStats.totalAppointments, icon: Calendar, trend: "+12%", up: true, color: "text-primary" },
  { title: "Today's Appointments", value: dashboardStats.todayAppointments, icon: Clock, trend: "+3", up: true, color: "text-info" },
  { title: "Pending Approvals", value: dashboardStats.pendingApprovals, icon: Activity, trend: "2 urgent", up: false, color: "text-warning-foreground" },
  { title: "Active Patients", value: dashboardStats.activePatients, icon: Users, trend: "+8%", up: true, color: "text-success" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function Index() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, Dr. Admin. Here's your clinic overview.</p>
        </div>
        <Button size="sm">
          <Calendar className="h-4 w-4 mr-1.5" />
          Today: May 7, 2026
        </Button>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                    <div className="flex items-center gap-1">
                      {stat.up ? (
                        <ArrowUpRight className="h-3 w-3 text-success" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-warning-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">{stat.trend}</span>
                    </div>
                  </div>
                  <div className={`rounded-xl p-2.5 bg-primary/10 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                <div className="flex items-center gap-1 text-sm">
                  <IndianRupee className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground">₹{(dashboardStats.monthlyRevenue / 1000).toFixed(1)}K</span>
                  <span className="text-xs text-muted-foreground">this month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appointment Mode */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Consultation Mode</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={appointmentModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {appointmentModeData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-2">
                {appointmentModeData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ background: d.fill }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">{d.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Appointments + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Appointment chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Appointments Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="appointments" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Upcoming</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-primary">View All</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{apt.patientName}</p>
                    <p className="text-xs text-muted-foreground">{apt.time} · {apt.problem}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
