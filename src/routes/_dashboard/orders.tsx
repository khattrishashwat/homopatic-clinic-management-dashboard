import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { mockOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/_dashboard/orders")({
  component: () => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="border-b bg-muted/50">
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Products</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
        </tr></thead><tbody>
          {mockOrders.map((o) => (
            <tr key={o.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
              <td className="px-4 py-3 font-medium">{o.customerName}</td>
              <td className="px-4 py-3 text-muted-foreground">{o.products.join(", ")}</td>
              <td className="px-4 py-3 font-semibold">₹{o.total}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
            </tr>
          ))}
        </tbody></table>
      </div></CardContent></Card>
    </motion.div>
  ),
});
