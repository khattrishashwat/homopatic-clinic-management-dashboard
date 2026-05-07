import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Clock, AlertCircle, Search, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { mockPayments } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/_dashboard/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<typeof mockPayments[0] | null>(null);

  const filtered = mockPayments.filter((p) => {
    const matchSearch = p.patientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = mockPayments.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const pendingDues = mockPayments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-success/10 p-3"><IndianRupee className="h-5 w-5 text-success" /></div>
            <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-xl font-bold">₹{totalRevenue.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-warning/10 p-3"><Clock className="h-5 w-5 text-warning-foreground" /></div>
            <div><p className="text-xs text-muted-foreground">Pending Dues</p><p className="text-xl font-bold">₹{pendingDues.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Transactions</p><p className="text-xl font-bold">{mockPayments.length}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search payments..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "completed", "pending", "failed"].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="capitalize text-xs">{s}</Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-3 font-medium">{p.patientName}</td>
                    <td className="px-4 py-3 font-semibold">₹{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.mode} /></td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelected(p)}><Eye className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>{selected?.id}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Patient</p><p className="font-medium">{selected.patientName}</p></div>
              <div><p className="text-muted-foreground">Amount</p><p className="font-bold text-lg">₹{selected.amount.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Date</p><p className="font-medium">{selected.date}</p></div>
              <div><p className="text-muted-foreground">Mode</p><StatusBadge status={selected.mode} /></div>
              <div><p className="text-muted-foreground">Status</p><StatusBadge status={selected.status} /></div>
              <div><p className="text-muted-foreground">Description</p><p className="font-medium">{selected.description}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}