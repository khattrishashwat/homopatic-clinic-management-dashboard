import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  MapPin,
  Package,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Truck,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ordersApi, type OrderDto } from "@/services/adminApi";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getAddressText,
  buildWhatsAppDispatchUrl,
  formatWhatsAppPhone,
} from "@/lib/format";

export const Route = createFileRoute("/_dashboard/orders")({
  component: OrdersPage,
});

const statusFilters = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;
const paymentFilters = ["all", "completed", "pending", "failed"] as const;

function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExportOrders = async () => {
    try {
      setIsExporting(true);
      const res = await ordersApi.exportExcel({
        order_status: statusFilter === "all" ? undefined : statusFilter,
        payment_status: paymentFilter === "all" ? undefined : paymentFilter,
      });
      const downloadUrl = res?.data?.downloadUrl;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
        toast.success(`Exported ${res?.data?.count ?? 0} orders to Excel`);
      } else {
        toast.error("Export did not return a download URL");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to export orders to Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // Modals state
  const [viewingOrder, setViewingOrder] = useState<OrderDto | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OrderDto | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");

  const params = {
    search: search.trim() || undefined,
    order_status: statusFilter === "all" ? undefined : statusFilter,
    payment_status: paymentFilter === "all" ? undefined : paymentFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: 50,
  };

  const ordersQuery = useQuery({
    queryKey: ["orders", params],
    queryFn: () => ordersApi.list(params),
  });

  const orders = ordersQuery.data?.data || [];

  // Delete Order Mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => ordersApi.delete(id, force),
    onSuccess: (res) => {
      toast.success(res?.message || "Order permanently deleted from database");
      setOrderToDelete(null);
      if (viewingOrder && orderToDelete && viewingOrder._id === orderToDelete._id) {
        setViewingOrder(null);
      }
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete order");
    },
  });

  // Dispatch Order Mutation
  const dispatchMutation = useMutation({
    mutationFn: ({
      id,
      tracking_number,
      courier_name,
      notes,
    }: {
      id: string;
      tracking_number?: string;
      courier_name?: string;
      notes?: string;
    }) => ordersApi.dispatch(id, { tracking_number, courier_name, notes }),
    onSuccess: (res) => {
      toast.success(res?.message || "Order marked as dispatched successfully");
      setIsDispatching(false);
      setTrackingNumber("");
      setCourierName("");
      setDispatchNotes("");
      if (res?.data) {
        setViewingOrder(res.data);
      }
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to dispatch order");
    },
  });

  const handleOpenView = (order: OrderDto) => {
    setViewingOrder(order);
    setIsDispatching(false);
    setTrackingNumber(order.tracking_number || "");
    setCourierName(order.courier_name || "");
    setDispatchNotes("");
  };

  const handleConfirmDispatch = () => {
    if (!viewingOrder) return;
    dispatchMutation.mutate({
      id: viewingOrder._id,
      tracking_number: trackingNumber,
      courier_name: courierName,
      notes: dispatchNotes,
    });
  };

  const handleOpenWhatsApp = (order: OrderDto) => {
    const formattedAddress = getAddressText(order.shipping_address);
    const url = buildWhatsAppDispatchUrl({
      customerName: order.customer_name,
      orderNumber: order.order_number,
      orderDate: order.created_at,
      dispatchDate: order.dispatch_date || new Date(),
      shippingAddress: formattedAddress,
      trackingNumber: order.tracking_number,
      customerPhone: order.customer_phone,
    });

    if (!url) {
      toast.error("Customer WhatsApp phone number is unavailable or invalid.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    toast.info("WhatsApp opened. Please click Send in WhatsApp to deliver the notification to the customer.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">Manage customer purchases, fulfillment, dispatch, and delivery notifications</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportOrders}
          disabled={isExporting}
        >
          <Download className="mr-1.5 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export to Excel"}
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order #, customer name, phone, or email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {statusFilters.map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={statusFilter === st ? "default" : "outline"}
                  onClick={() => setStatusFilter(st)}
                  className="capitalize text-xs h-9"
                >
                  {st}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">Payment:</span>
              <div className="flex gap-1.5">
                {paymentFilters.map((pf) => (
                  <Button
                    key={pf}
                    size="sm"
                    variant={paymentFilter === pf ? "default" : "outline"}
                    onClick={() => setPaymentFilter(pf)}
                    className="capitalize text-xs h-8"
                  >
                    {pf === "completed" ? "Paid" : pf}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Date:</span>
              <Input
                type="date"
                className="h-8 w-32 text-xs"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                className="h-8 w-32 text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To"
              />
              {(startDate || endDate || search || statusFilter !== "all" || paymentFilter !== "all") && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Reset all filters"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPaymentFilter("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["Order #", "Customer", "Products", "Discount", "Total", "Status", "Payment", "Date", "Actions"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {ordersQuery.isLoading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      Loading orders...
                    </td>
                  </tr>
                )}
                {orders.map((order) => {
                  const isPaid = order.payment_status === "completed" || order.payment_status === "paid";
                  const isDispatched = order.order_status === "shipped" || order.order_status === "dispatched";
                  return (
                    <tr key={order._id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{order.customer_name}</div>
                        {order.customer_phone && (
                          <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                        )}
                        {order.customer_email && (
                          <div className="text-[11px] text-muted-foreground">{order.customer_email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {(order.items || []).map((item) => item.product?.name || "Product").join(", ") || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {order.coupon_code ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded w-fit">
                              {order.coupon_code}
                            </span>
                            {order.discount ? (
                              <span className="text-[11px] text-emerald-600 font-medium">
                                - {formatCurrency(order.discount)}
                              </span>
                            ) : null}
                          </div>
                        ) : order.discount ? (
                          <span className="text-xs text-emerald-600 font-medium">- {formatCurrency(order.discount)}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap text-foreground">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={order.order_status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={order.payment_status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs flex items-center gap-1 font-medium"
                            title="View Full Order Details"
                            onClick={() => handleOpenView(order)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Permanently Delete Order"
                            disabled={deleteMutation.isPending}
                            onClick={() => setOrderToDelete(order)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!ordersQuery.isLoading && orders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      No orders found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ====================================================== */}
      {/* 4 & 5. Order Details / View Modal with Dispatch & WhatsApp */}
      {/* ====================================================== */}
      <Dialog open={!!viewingOrder} onOpenChange={() => !dispatchMutation.isPending && setViewingOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Order #{viewingOrder?.order_number}
                </DialogTitle>
                <DialogDescription>
                  Placed on {viewingOrder?.created_at ? formatDateTime(viewingOrder.created_at) : "Recent"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-5 py-2">
              {/* Customer & Status Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 p-4 rounded-xl border border-border text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer Name</p>
                  <p className="font-semibold text-foreground mt-0.5">{viewingOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp / Phone</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {viewingOrder.customer_phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer Email</p>
                  <p className="font-medium text-foreground mt-0.5">{viewingOrder.customer_email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Status</p>
                  <div className="mt-0.5">
                    <StatusBadge status={viewingOrder.order_status} />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="rounded-xl border border-border p-4 bg-card text-sm space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" /> Shipping Delivery Address
                </p>
                <div className="text-foreground pl-5.5 leading-relaxed">
                  <p className="font-medium">{viewingOrder.shipping_address?.street || "No street address provided"}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      viewingOrder.shipping_address?.city,
                      viewingOrder.shipping_address?.state,
                      viewingOrder.shipping_address?.postal_code,
                      viewingOrder.shipping_address?.country || "India",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>

              {/* Ordered Products Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/60 px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ordered Products ({viewingOrder.items?.length || 0})
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Price × Qty</span>
                </div>
                <div className="divide-y divide-border text-sm">
                  {(viewingOrder.items || []).map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt={item.product?.name || "Product"}
                            className="h-10 w-10 rounded-md object-cover border border-border"
                          />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{item.product?.name || "Homoeopathic Medicine"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="font-semibold text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                  {(!viewingOrder.items || viewingOrder.items.length === 0) && (
                    <div className="p-4 text-center text-xs text-muted-foreground">No products recorded</div>
                  )}
                </div>

                {/* Financial Totals */}
                <div className="bg-muted/30 p-4 border-t border-border space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Subtotal</span>
                    <span>{formatCurrency(viewingOrder.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Shipping Charges</span>
                    <span>{formatCurrency(viewingOrder.shipping_cost || 0)}</span>
                  </div>
                  {viewingOrder.discount ? (
                    <div className="flex justify-between text-emerald-600 text-xs font-medium">
                      <span>Discount {viewingOrder.coupon_code ? `(${viewingOrder.coupon_code})` : ""}</span>
                      <span>- {formatCurrency(viewingOrder.discount)}</span>
                    </div>
                  ) : null}
                  {viewingOrder.tax ? (
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Tax</span>
                      <span>{formatCurrency(viewingOrder.tax)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-foreground font-bold pt-2 border-t border-border/80 text-base">
                    <span>Total Amount</span>
                    <span className="text-primary">{formatCurrency(viewingOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="rounded-xl border border-border p-4 bg-card text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-primary" /> Payment Information
                  </p>
                  <StatusBadge status={viewingOrder.payment_status} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground">Method: </span>
                    <span className="font-medium text-foreground">
                      {typeof viewingOrder.payment === "object" && viewingOrder.payment?.payment_method
                        ? viewingOrder.payment.payment_method.toUpperCase()
                        : "Online Gateway (Razorpay)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment ID: </span>
                    <span className="font-mono text-foreground">
                      {viewingOrder.razorpay_payment_id ||
                        (typeof viewingOrder.payment === "object" && viewingOrder.payment?.razorpay_payment_id) ||
                        "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gateway Order ID: </span>
                    <span className="font-mono text-foreground">{viewingOrder.razorpay_order_id || "—"}</span>
                  </div>
                </div>
              </div>

              {/* ====================================================== */}
              {/* 5. Dispatch & Fulfillment Section */}
              {/* ====================================================== */}
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-primary" /> Fulfillment & Dispatch
                  </p>
                  {viewingOrder.dispatch_date && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched
                    </span>
                  )}
                </div>

                {/* If already dispatched */}
                {viewingOrder.dispatch_date ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-background p-3 rounded-lg border border-border text-xs">
                      <div>
                        <span className="text-muted-foreground block">Dispatch Date:</span>
                        <span className="font-semibold text-foreground">
                          {formatDateTime(viewingOrder.dispatch_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Courier:</span>
                        <span className="font-semibold text-foreground">
                          {viewingOrder.courier_name || "Standard Courier"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Tracking Number:</span>
                        <span className="font-mono font-semibold text-primary">
                          {viewingOrder.tracking_number || "Available on request"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <p className="text-xs text-muted-foreground">
                        Customer WhatsApp: <span className="font-medium text-foreground">{viewingOrder.customer_phone}</span>
                      </p>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5"
                        onClick={() => handleOpenWhatsApp(viewingOrder)}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send WhatsApp Dispatch Notification
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Not yet dispatched */
                  <div className="space-y-3">
                    {/* Eligibility check warning */}
                    {viewingOrder.payment_status !== "completed" && viewingOrder.payment_status !== "paid" ? (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold">Unconfirmed Payment Notice</p>
                          <p>
                            Payment status is currently <strong>'{viewingOrder.payment_status}'</strong>. Product fulfillment
                            rules require payment confirmation before dispatching.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {isDispatching ? (
                      <div className="space-y-3 bg-background p-3.5 rounded-lg border border-border text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-medium text-foreground block mb-1">Tracking Number</label>
                            <Input
                              placeholder="e.g. DTDC123456789"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <label className="font-medium text-foreground block mb-1">Courier Service</label>
                            <Input
                              placeholder="e.g. DTDC, Delhivery, Blue Dart, India Post"
                              value={courierName}
                              onChange={(e) => setCourierName(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="font-medium text-foreground block mb-1">Dispatch Notes (Optional)</label>
                          <Input
                            placeholder="Optional internal dispatch notes..."
                            value={dispatchNotes}
                            onChange={(e) => setDispatchNotes(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={dispatchMutation.isPending}
                            onClick={() => setIsDispatching(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-primary"
                            disabled={dispatchMutation.isPending}
                            onClick={handleConfirmDispatch}
                          >
                            {dispatchMutation.isPending ? "Dispatching..." : "Confirm & Save Dispatch"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <p className="text-xs text-muted-foreground">
                          Order is ready for packing and dispatch. Update status to generate customer notifications.
                        </p>
                        <Button
                          size="sm"
                          className="bg-primary text-xs flex items-center gap-1.5"
                          disabled={
                            viewingOrder.order_status === "cancelled" ||
                            viewingOrder.order_status === "refunded" ||
                            (viewingOrder.payment_status !== "completed" && viewingOrder.payment_status !== "paid")
                          }
                          onClick={() => setIsDispatching(true)}
                        >
                          <Truck className="h-3.5 w-3.5" />
                          Dispatch Order
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between pt-2 border-t border-border">
            {viewingOrder && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setOrderToDelete(viewingOrder)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete Order
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setViewingOrder(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================================================== */}
      {/* 3. Order Permanent Delete Confirmation Modal */}
      {/* ====================================================== */}
      <Dialog
        open={!!orderToDelete}
        onOpenChange={() => !deleteMutation.isPending && setOrderToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this order from the database? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {orderToDelete && (
            <div className="space-y-3 py-2 text-sm">
              <div className="rounded-lg bg-muted/60 p-3 space-y-1.5 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order #:</span>
                  <span className="font-mono font-semibold">{orderToDelete.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold">{orderToDelete.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold">{formatCurrency(orderToDelete.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Status:</span>
                  <StatusBadge status={orderToDelete.order_status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <StatusBadge status={orderToDelete.payment_status} />
                </div>
              </div>

              {/* Safeguard note for paid or shipped orders */}
              {(orderToDelete.payment_status === "completed" ||
                orderToDelete.payment_status === "paid" ||
                ["shipped", "dispatched", "delivered"].includes(orderToDelete.order_status)) && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /> Financial Record Safeguard
                  </p>
                  <p>
                    This order has already been paid or fulfilled. Deletion will remove the order fulfillment entry,
                    while payment transactions and financial audit history in the database will be preserved.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setOrderToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                orderToDelete &&
                deleteMutation.mutate({
                  id: orderToDelete._id,
                  force: true,
                })
              }
            >
              {deleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

