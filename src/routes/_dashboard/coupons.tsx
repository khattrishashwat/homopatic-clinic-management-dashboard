import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  couponsApi,
  type CouponDto,
  type CouponUsageDto,
} from "@/services/adminApi";

export const Route = createFileRoute("/_dashboard/coupons")({
  component: CouponsPage,
});

interface CouponFormData {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minimumOrderValue: number;
  maximumDiscount: number | null;
  usageLimit: number | null;
  perCustomerLimit: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

const defaultFormData: CouponFormData = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: 10,
  minimumOrderValue: 0,
  maximumDiscount: null,
  usageLimit: null,
  perCustomerLimit: 2, // Business requirement: default 2
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  active: true,
};

function CouponsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CouponDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);

  // Usage dialog state
  const [viewingUsageCoupon, setViewingUsageCoupon] = useState<CouponDto | null>(null);
  const [usageList, setUsageList] = useState<CouponUsageDto[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const couponsQuery = useQuery({
    queryKey: ["coupons", search],
    queryFn: () => couponsApi.list({ search: search.trim() || undefined }),
  });
  const coupons = couponsQuery.data?.data || [];

  const saveMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const payload: Partial<CouponDto> = {
        code: data.code.toUpperCase().trim(),
        description: data.description.trim(),
        discountType: data.discountType,
        discountValue: Number(data.discountValue),
        minimumOrderValue: Number(data.minimumOrderValue || 0),
        maximumDiscount: data.maximumDiscount ? Number(data.maximumDiscount) : null,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
        perCustomerLimit: Number(data.perCustomerLimit || 2),
        startDate: data.startDate || new Date().toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        active: Boolean(data.active),
      };

      if (editing) {
        return couponsApi.update(editing._id, payload);
      } else {
        return couponsApi.create(payload);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Coupon updated successfully" : "Coupon created successfully");
      setShowForm(false);
      setEditing(null);
      setFormData(defaultFormData);
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save coupon");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      return couponsApi.toggleStatus(id);
    },
    onSuccess: () => {
      toast.success("Coupon status updated");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return couponsApi.delete(id);
    },
    onSuccess: () => {
      toast.success("Coupon deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete coupon");
    },
  });

  const openForm = (coupon?: CouponDto) => {
    if (coupon) {
      setEditing(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType || "PERCENTAGE",
        discountValue: coupon.discountValue,
        minimumOrderValue: coupon.minimumOrderValue || 0,
        maximumDiscount: coupon.maximumDiscount ?? null,
        usageLimit: coupon.usageLimit ?? null,
        perCustomerLimit: coupon.perCustomerLimit ?? 2,
        startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split("T")[0] : "",
        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split("T")[0] : "",
        active: coupon.active,
      });
    } else {
      setEditing(null);
      setFormData(defaultFormData);
    }
    setShowForm(true);
  };

  const openUsageDialog = async (coupon: CouponDto) => {
    setViewingUsageCoupon(coupon);
    setLoadingUsage(true);
    try {
      const res = await couponsApi.getUsage(coupon._id);
      setUsageList(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load usage details");
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleDelete = (coupon: CouponDto) => {
    if (confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
      deleteMutation.mutate(coupon._id);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" />
            Product Coupons
          </h1>
          <p className="text-sm text-muted-foreground">
            Create promotional discount codes (Max 2 uses per customer rule enforced)
          </p>
        </div>
        <Button onClick={() => openForm()} className="gap-2">
          <Plus className="h-4 w-4" /> Add Coupon
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coupon code..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code & Description</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min. Order</TableHead>
                <TableHead>Customer Limit</TableHead>
                <TableHead>Total Used</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couponsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Loading coupons...
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No coupons found. Click "Add Coupon" to create your first discount code.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => {
                  const isExpired = coupon.endDate && new Date(coupon.endDate) < new Date();
                  return (
                    <TableRow key={coupon._id}>
                      <TableCell>
                        <div className="font-mono font-bold text-sm bg-primary/10 text-primary px-2.5 py-1 rounded inline-block">
                          {coupon.code}
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {coupon.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">
                          {coupon.discountType === "PERCENTAGE"
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} FLAT`}
                        </div>
                        {coupon.discountType === "PERCENTAGE" && coupon.maximumDiscount ? (
                          <div className="text-xs text-muted-foreground">
                            Max: ₹{coupon.maximumDiscount}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {coupon.minimumOrderValue ? `₹${coupon.minimumOrderValue}` : "None"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium">
                          {coupon.perCustomerLimit || 2}x / customer
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {coupon.usedCount || 0}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " uses"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {coupon.startDate && (
                            <div>From: {new Date(coupon.startDate).toLocaleDateString()}</div>
                          )}
                          {coupon.endDate ? (
                            <div className={isExpired ? "text-destructive font-semibold" : ""}>
                              To: {new Date(coupon.endDate).toLocaleDateString()}
                              {isExpired && " (Expired)"}
                            </div>
                          ) : (
                            <div className="text-emerald-600 dark:text-emerald-400">No expiry</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={coupon.active && !isExpired}
                            disabled={toggleStatusMutation.isPending || isExpired}
                            onCheckedChange={() => toggleStatusMutation.mutate(coupon._id)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {isExpired ? "Expired" : coupon.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Usage History"
                            onClick={() => openUsageDialog(coupon)}
                          >
                            <Users className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Coupon"
                            onClick={() => openForm(coupon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Coupon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(coupon)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
            <DialogDescription>
              Set coupon discount, validity, and per-customer limits.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate(formData);
            }}
            className="space-y-4 pt-2"
          >
            {/* Code & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  required
                  placeholder="e.g. WELCOME10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="font-mono uppercase font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(val: "PERCENTAGE" | "FIXED") =>
                    setFormData({ ...formData, discountType: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Discount Value & Max Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  {formData.discountType === "PERCENTAGE" ? "Discount Percentage (%) *" : "Discount Amount (₹) *"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  required
                  min={1}
                  max={formData.discountType === "PERCENTAGE" ? 100 : 100000}
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximumDiscount">
                  Max Discount Cap (₹) {formData.discountType === "FIXED" && "(N/A)"}
                </Label>
                <Input
                  id="maximumDiscount"
                  type="number"
                  min={0}
                  disabled={formData.discountType === "FIXED"}
                  placeholder="Optional cap (e.g. 500)"
                  value={formData.maximumDiscount ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maximumDiscount: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>

            {/* Min Order Value & Per Customer Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumOrderValue">Min. Order Amount (₹)</Label>
                <Input
                  id="minimumOrderValue"
                  type="number"
                  min={0}
                  placeholder="0 (no minimum)"
                  value={formData.minimumOrderValue || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumOrderValue: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perCustomerLimit">
                  Per-Customer Limit * <span className="text-primary font-bold">(Rule: 2)</span>
                </Label>
                <Input
                  id="perCustomerLimit"
                  type="number"
                  min={1}
                  required
                  value={formData.perCustomerLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, perCustomerLimit: Number(e.target.value) || 2 })
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Max times a customer (same email or phone) can use this coupon.
                </p>
              </div>
            </div>

            {/* Total Global Limit */}
            <div className="space-y-2">
              <Label htmlFor="usageLimit">Global Usage Limit (Across all customers)</Label>
              <Input
                id="usageLimit"
                type="number"
                min={1}
                placeholder="Optional (blank for unlimited)"
                value={formData.usageLimit ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Expiry)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="e.g. 10% off for first-time orders (max 2 uses per customer)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Active switch */}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label className="text-sm font-semibold">Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Enable coupon for website checkout immediately
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(val) => setFormData({ ...formData, active: val })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : editing
                  ? "Update Coupon"
                  : "Create Coupon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Usage Analytics Modal */}
      <Dialog
        open={Boolean(viewingUsageCoupon)}
        onOpenChange={(open) => !open && setViewingUsageCoupon(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usage History for{" "}
              <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                {viewingUsageCoupon?.code}
              </span>
            </DialogTitle>
            <DialogDescription>
              All customer orders that successfully used this coupon. (Limit: {viewingUsageCoupon?.perCustomerLimit || 2} uses per customer)
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {loadingUsage ? (
              <div className="py-10 text-center text-muted-foreground">Loading usage records...</div>
            ) : usageList.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No orders have used this coupon yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Discount Given</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Used Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageList.map((usage) => (
                    <TableRow key={usage._id}>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {usage.order?.customer_name || "Customer"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {usage.customerEmail || usage.order?.customer_email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {usage.customerMobile || usage.order?.customer_phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold">
                          {usage.order?.order_number || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          - ₹{usage.discountAmount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            usage.order?.payment_status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize text-xs"
                        >
                          {usage.order?.payment_status || "confirmed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {usage.usedAt ? new Date(usage.usedAt).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
