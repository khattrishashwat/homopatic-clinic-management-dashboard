import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Star,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  Clock,
  Search,
  Filter,
  Check,
  X,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { reviewsApi, productsApi, type ReviewDto } from "@/services/adminApi";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/reviews")({
  component: ReviewsPage,
});

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  google_review: {
    label: "Google Review",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  testimonial: {
    label: "Testimonial",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  },
  product_review: {
    label: "Product Review",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  blog_comment: {
    label: "Blog Comment",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  patient_story: {
    label: "Patient Story",
    color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300",
    icon: Clock,
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300",
    icon: XCircle,
  },
};

function ReviewsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [editing, setEditing] = useState<ReviewDto | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch products for filtering and assignment
  const productsQuery = useQuery({
    queryKey: ["admin-products-dropdown"],
    queryFn: () => productsApi.list({ limit: 100 }),
  });
  const products = productsQuery.data?.data || [];

  const reviewsQuery = useQuery({
    queryKey: ["reviews", selectedType, selectedStatus, selectedProduct, search],
    queryFn: () =>
      reviewsApi.list({
        limit: 100,
        review_type: selectedType === "all" ? undefined : selectedType,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        product: selectedProduct === "all" ? undefined : selectedProduct,
        search: search.trim() ? search.trim() : undefined,
      }),
  });

  const reviews = reviewsQuery.data?.data || [];

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const formStatus = String(formData.get("status") || "pending");
      const isApproved = formStatus === "approved";

      const payload: Partial<ReviewDto> = {
        review_type: (formData.get("review_type") as any) || "product_review",
        target_slug: String(formData.get("target_slug") || ""),
        reviewer_name: String(formData.get("reviewer_name") || ""),
        reviewer_email: String(formData.get("reviewer_email") || ""),
        rating: Number(formData.get("rating") || 5),
        title: String(formData.get("title") || ""),
        comment: String(formData.get("comment") || ""),
        relativeTime: String(formData.get("relativeTime") || ""),
        status: formStatus as any,
        approved: isApproved,
        order: Number(formData.get("order") || 0),
      };

      if (editing) {
        return reviewsApi.update(editing._id, payload);
      } else {
        return reviewsApi.create(payload);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Review updated" : "Review added");
      setShowForm(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save review");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "pending" | "approved" | "rejected";
    }) => {
      return reviewsApi.update(id, {
        status,
        approved: status === "approved",
      });
    },
    onSuccess: (_, variables) => {
      toast.success(`Review ${variables.status} successfully`);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update review status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return reviewsApi.delete(id);
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete review");
    },
  });

  const openForm = (review?: ReviewDto) => {
    setEditing(review || null);
    setShowForm(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveMutation.mutate(new FormData(e.currentTarget));
  };

  const tabs = [
    { key: "all", label: "All Types" },
    { key: "product_review", label: "Product Reviews" },
    { key: "blog_comment", label: "Blog Comments" },
    { key: "google_review", label: "Google Reviews" },
    { key: "testimonial", label: "Testimonials" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reviews & Moderation</h1>
          <p className="text-sm text-muted-foreground">
            Approve, reject, filter, and manage genuine customer reviews and feedback
          </p>
        </div>
        <Button size="sm" onClick={() => openForm()}>
          <Plus className="mr-1 h-4 w-4" /> Add Review
        </Button>
      </div>

      {/* Type Tabs */}
      <div className="flex border-b gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              selectedType === tab.key
                ? "border-b-2 border-primary text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSelectedType(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status:
            </span>
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {products.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 ml-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Product:
                </span>
              </div>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-[180px] h-9 text-xs truncate">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {reviewsQuery.isLoading && (
        <div className="flex justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        </div>
      )}

      {!reviewsQuery.isLoading && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card">
          <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/60" />
          <h3 className="text-lg font-semibold">No reviews found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {selectedStatus !== "all"
              ? `No ${selectedStatus} reviews match the current filters.`
              : "No customer reviews or testimonials recorded yet."}
          </p>
          <Button className="mt-4" onClick={() => openForm()}>
            <Plus className="mr-1 h-4 w-4" /> Add Review
          </Button>
        </div>
      )}

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review) => {
          const typeKey = (review.review_type ||
            (review as any).type ||
            "google_review") as keyof typeof TYPE_LABELS;
          const typeInfo = TYPE_LABELS[typeKey] || {
            label: String(typeKey).replace(/_/g, " "),
            color: "bg-gray-100 text-gray-800",
          };

          const rawStatus =
            review.status || (review.approved ? "approved" : "pending");
          const statusInfo = STATUS_LABELS[rawStatus] || STATUS_LABELS.pending;
          const StatusIcon = statusInfo.icon;

          const reviewerName =
            review.reviewer_name || (review as any).name || "Anonymous";
          const reviewComment =
            review.comment || (review as any).message || "";
          const targetSlug =
            review.target_slug || (review as any).target_id || "";

          return (
            <Card
              key={review._id}
              className={`relative transition-all hover:shadow-md border ${
                rawStatus === "pending"
                  ? "border-amber-300/80 bg-amber-500/[0.02]"
                  : rawStatus === "rejected"
                    ? "border-rose-200/80 opacity-75"
                    : ""
              }`}
            >
              <CardContent className="p-5 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeInfo.color}`}
                      >
                        {typeInfo.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusInfo.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < (review.rating || 5)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {targetSlug && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md truncate max-w-full">
                        <Package className="h-3 w-3 shrink-0" />
                        {targetSlug}
                      </span>
                    </div>
                  )}

                  {review.title && (
                    <h4 className="font-semibold text-sm text-foreground mb-1">
                      {review.title}
                    </h4>
                  )}

                  <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed italic mb-4">
                    &ldquo;{reviewComment}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        {reviewerName}
                        {review.verified_purchase && (
                          <span
                            title="Verified Purchase"
                            className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded"
                          >
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {review.relativeTime ||
                          (review.createdAt ? formatDate(review.createdAt) : "Recently")}
                        {review.reviewer_email && ` • ${review.reviewer_email}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Edit Review"
                        onClick={() => openForm(review)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete Review"
                        onClick={() => {
                          if (confirm(`Delete review from "${reviewerName}"?`)) {
                            deleteMutation.mutate(review._id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Moderation Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-dashed">
                    {rawStatus !== "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: review._id,
                            status: "approved",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                    )}
                    {rawStatus !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs border-rose-600/40 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: review._id,
                            status: "rejected",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    )}
                    {rawStatus !== "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        title="Move back to Pending"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: review._id,
                            status: "pending",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        Reset to Pending
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Review Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editing ? "Edit Review" : "Add New Review"}
            </DialogTitle>
            <DialogDescription>
              Configure review moderation details and public display
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="review_type">Review Type *</Label>
                <Select
                  name="review_type"
                  defaultValue={
                    editing?.review_type ||
                    (editing as any)?.type ||
                    (selectedType !== "all" ? selectedType : "product_review")
                  }
                >
                  <SelectTrigger id="review_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_review">Product Review</SelectItem>
                    <SelectItem value="blog_comment">Blog Comment</SelectItem>
                    <SelectItem value="google_review">Google Review</SelectItem>
                    <SelectItem value="testimonial">Testimonial</SelectItem>
                    <SelectItem value="patient_story">Patient Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Moderation Status *</Label>
                <Select
                  name="status"
                  defaultValue={
                    editing?.status ||
                    (editing?.approved ? "approved" : "pending")
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved (Public)</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="rejected">Rejected (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="target_slug">Product / Blog Slug</Label>
                <Input
                  id="target_slug"
                  name="target_slug"
                  placeholder="e.g. hair-regrowth-oil"
                  defaultValue={editing?.target_slug || ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rating">Rating (1-5 Stars) *</Label>
                <Select name="rating" defaultValue={String(editing?.rating || 5)}>
                  <SelectTrigger id="rating">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Stars (Excellent)</SelectItem>
                    <SelectItem value="4">4 Stars (Very Good)</SelectItem>
                    <SelectItem value="3">3 Stars (Average)</SelectItem>
                    <SelectItem value="2">2 Stars (Poor)</SelectItem>
                    <SelectItem value="1">1 Star (Terrible)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="reviewer_name">Customer / Author Name *</Label>
                <Input
                  id="reviewer_name"
                  name="reviewer_name"
                  required
                  placeholder="e.g. Priya Sharma"
                  defaultValue={
                    editing?.reviewer_name || (editing as any)?.name || ""
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reviewer_email">Email (Optional)</Label>
                <Input
                  id="reviewer_email"
                  name="reviewer_email"
                  type="email"
                  placeholder="priya@example.com"
                  defaultValue={
                    editing?.reviewer_email || (editing as any)?.email || ""
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Headline (Optional)</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Noticeable Improvement"
                  defaultValue={editing?.title || ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="relativeTime">Display Date / Time</Label>
                <Input
                  id="relativeTime"
                  name="relativeTime"
                  placeholder="e.g., 2 weeks ago"
                  defaultValue={editing?.relativeTime || ""}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comment">Written Review Content *</Label>
              <Textarea
                id="comment"
                name="comment"
                required
                rows={4}
                placeholder="Customer review text..."
                defaultValue={
                  editing?.comment || (editing as any)?.message || ""
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Saving..."
                  : editing
                    ? "Update Review"
                    : "Add Review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
