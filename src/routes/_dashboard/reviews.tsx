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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reviewsApi, type ReviewDto } from "@/services/adminApi";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/reviews")({
  component: ReviewsPage,
});

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  google_review: { label: "Google Review", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  testimonial: { label: "Testimonial", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  product_review: { label: "Product Review", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  blog_comment: { label: "Blog Comment", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  patient_story: { label: "Patient Story", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
};

function ReviewsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [editing, setEditing] = useState<ReviewDto | null>(null);
  const [showForm, setShowForm] = useState(false);

  const reviewsQuery = useQuery({
    queryKey: ["reviews", selectedType],
    queryFn: () =>
      reviewsApi.list({
        limit: 100,
        review_type: selectedType === "all" ? undefined : selectedType,
      }),
  });

  const reviews = reviewsQuery.data?.data || [];

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const payload: Partial<ReviewDto> = {
        review_type: (formData.get("review_type") as any) || "google_review",
        reviewer_name: String(formData.get("reviewer_name") || ""),
        reviewer_email: String(formData.get("reviewer_email") || ""),
        rating: Number(formData.get("rating") || 5),
        title: String(formData.get("title") || ""),
        comment: String(formData.get("comment") || ""),
        relativeTime: String(formData.get("relativeTime") || ""),
        approved: formData.get("approved") === "on",
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

  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      return reviewsApi.update(id, { approved });
    },
    onSuccess: () => {
      toast.success("Review status updated");
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
    { key: "all", label: "All Reviews" },
    { key: "google_review", label: "Google Reviews" },
    { key: "testimonial", label: "Testimonials" },
    { key: "product_review", label: "Product Reviews" },
    { key: "blog_comment", label: "Blog Comments" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reviews & Testimonials</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer feedback, Google reviews, and testimonials displayed across the website
          </p>
        </div>
        <Button size="sm" onClick={() => openForm()}>
          <Plus className="mr-1 h-4 w-4" /> Add Review
        </Button>
      </div>

      {/* Tabs */}
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
            {selectedType === "all"
              ? "Start by adding your first patient testimonial or Google review"
              : `No reviews found for category "${selectedType.replace("_", " ")}"`}
          </p>
          <Button className="mt-4" onClick={() => openForm()}>
            <Plus className="mr-1 h-4 w-4" /> Add Review
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review) => {
          const typeInfo = TYPE_LABELS[review.review_type] || {
            label: review.review_type,
            color: "bg-gray-100 text-gray-800",
          };

          return (
            <Card key={review._id} className="relative transition-all hover:shadow-md border">
              <CardContent className="p-5 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="font-semibold text-sm text-foreground mb-1">
                      {review.title}
                    </h4>
                  )}

                  <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed italic mb-4">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1">
                      {review.reviewer_name}
                      {review.approved && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline" title="Approved" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {review.relativeTime || (review.createdAt ? formatDate(review.createdAt) : "Recently")}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title={review.approved ? "Approved (click to unapprove)" : "Pending (click to approve)"}
                      onClick={() =>
                        toggleApprovalMutation.mutate({
                          id: review._id,
                          approved: !review.approved,
                        })
                      }
                      disabled={toggleApprovalMutation.isPending}
                    >
                      {review.approved ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openForm(review)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete review from "${review.reviewer_name}"?`)) {
                          deleteMutation.mutate(review._id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Review Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) setEditing(null);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editing ? "Edit Review" : "Add New Review"}
            </DialogTitle>
            <DialogDescription>
              Configure review details to display on website sections
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="review_type">Review Type *</Label>
                <Select
                  name="review_type"
                  defaultValue={editing?.review_type || (selectedType !== "all" ? selectedType : "google_review")}
                >
                  <SelectTrigger id="review_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_review">Google Review</SelectItem>
                    <SelectItem value="testimonial">Testimonial</SelectItem>
                    <SelectItem value="product_review">Product Review</SelectItem>
                    <SelectItem value="blog_comment">Blog Comment</SelectItem>
                    <SelectItem value="patient_story">Patient Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rating">Rating (1-5) *</Label>
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
                <Label htmlFor="reviewer_name">Reviewer Name *</Label>
                <Input
                  id="reviewer_name"
                  name="reviewer_name"
                  required
                  placeholder="e.g. Priya Sharma"
                  defaultValue={editing?.reviewer_name}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reviewer_email">Reviewer Email (Optional)</Label>
                <Input
                  id="reviewer_email"
                  name="reviewer_email"
                  type="email"
                  placeholder="priya@example.com"
                  defaultValue={editing?.reviewer_email}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Headline / Title (Optional)</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Amazing Hair Regrowth Results"
                  defaultValue={editing?.title}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="relativeTime">Display Time / Age</Label>
                <Input
                  id="relativeTime"
                  name="relativeTime"
                  placeholder="e.g., a week ago, 3 months ago"
                  defaultValue={editing?.relativeTime}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comment">Review Content / Testimonial *</Label>
              <Textarea
                id="comment"
                name="comment"
                required
                rows={4}
                placeholder="Write the full testimonial text here..."
                defaultValue={editing?.comment}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center rounded-lg border p-3">
              <div>
                <Label htmlFor="approved" className="font-semibold text-sm">
                  Approved / Published
                </Label>
                <p className="text-xs text-muted-foreground">
                  Visible to public visitors on the website
                </p>
              </div>
              <div className="flex justify-end">
                <Switch
                  id="approved"
                  name="approved"
                  defaultChecked={editing?.approved ?? true}
                />
              </div>
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
                {saveMutation.isPending ? "Saving..." : editing ? "Update Review" : "Add Review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
