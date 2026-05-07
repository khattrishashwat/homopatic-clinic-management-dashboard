import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Eye, IndianRupee, Search, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { paymentsApi, type PaymentDto } from "@/services/adminApi";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<PaymentDto | null>(null);
  const paymentsQuery = useQuery({
    queryKey: ["payments", statusFilter],
    queryFn: () => paymentsApi.list({ status: statusFilter === "all" ? undefined : statusFilter, limit: 50 }),
  });
  const payments = paymentsQuery.data?.data || [];
  const filtered = payments.filter((payment) => (payment.customer_name || payment.patient?.name || "").toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = payments.filter((payment) => payment.status === "captured").reduce((sum, payment) => sum + payment.amount, 0);
  const pendingDues = payments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Summary icon={IndianRupee} label="Total Revenue" value={formatCurrency(totalRevenue)} />
        <Summary icon={Clock} label="Pending Dues" value={formatCurrency(pendingDues)} />
        <Summary icon={TrendingUp} label="Transactions" value={String(payments.length)} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search payments..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "captured", "pending", "failed", "refunded"].map((status) => (
            <Button key={status} size="sm" variant={statusFilter === status ? "default" : "outline"} onClick={() => setStatusFilter(status)} className="capitalize text-xs">{status}</Button>
          ))}
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{["ID", "Patient", "Amount", "Date", "Mode", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {paymentsQuery.isLoading && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Loading payments...</td></tr>}
                {filtered.map((payment) => (
                  <tr key={payment._id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{payment._id.slice(-8)}</td>
                    <td className="px-4 py-3 font-medium">{payment.customer_name || payment.patient?.name || "-"}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(payment.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={payment.payment_method || "online"} /></td>
                    <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
                    <td className="px-4 py-3"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelected(payment)}><Eye className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
                {!paymentsQuery.isLoading && filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No payments found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transaction Details</DialogTitle><DialogDescription>{selected?._id}</DialogDescription></DialogHeader>
          {selected && <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Patient</p><p className="font-medium">{selected.customer_name || selected.patient?.name || "-"}</p></div>
            <div><p className="text-muted-foreground">Amount</p><p className="text-lg font-bold">{formatCurrency(selected.amount)}</p></div>
            <div><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.created_at)}</p></div>
            <div><p className="text-muted-foreground">Mode</p><StatusBadge status={selected.payment_method || "online"} /></div>
            <div><p className="text-muted-foreground">Status</p><StatusBadge status={selected.status} /></div>
            <div><p className="text-muted-foreground">Description</p><p className="font-medium">{selected.description || "-"}</p></div>
          </div>}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof IndianRupee; label: string; value: string }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-primary/10 p-3"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div></CardContent></Card>;
}
