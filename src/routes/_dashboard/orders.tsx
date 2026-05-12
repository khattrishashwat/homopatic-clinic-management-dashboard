import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { ordersApi } from "@/services/adminApi";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const ordersQuery = useQuery({ queryKey: ["orders"], queryFn: () => ordersApi.list({ limit: 50 }) });
  const orders = ordersQuery.data?.data || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["ID", "Customer", "Products", "Total", "Status", "Payment", "Date"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left font-medium text-muted-foreground">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordersQuery.isLoading && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Loading orders...</td></tr>}
                {orders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="px-4 py-3 font-medium">{order.customer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{(order.items || []).map((item) => item.product?.name || "Product").join(", ") || "-"}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.order_status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.payment_status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
                {!ordersQuery.isLoading && orders.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No orders found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
