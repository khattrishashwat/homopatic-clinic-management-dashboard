import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  HelpCircle,
  Filter,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { faqsApi, type FaqDto } from "@/services/adminApi";

export const Route = createFileRoute("/_dashboard/faqs")({
  component: FaqsPage,
});

interface FaqFormData {
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
}

const DEFAULT_FORM: FaqFormData = {
  question: "",
  answer: "",
  category: "General",
  order: 0,
  active: true,
};

function FaqsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqDto | null>(null);
  const [formData, setFormData] = useState<FaqFormData>(DEFAULT_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-faqs", searchTerm, selectedCategory],
    queryFn: () =>
      faqsApi.list({
        search: searchTerm || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      }),
  });

  const faqs = data?.data || [];

  // Extract unique categories for filter
  const categories = Array.from(
    new Set(faqs.map((f) => f.category || "General").filter(Boolean))
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: FaqFormData) => {
      if (editingFaq) {
        return faqsApi.update(editingFaq._id, payload);
      } else {
        return faqsApi.create(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingFaq ? "FAQ updated successfully" : "FAQ created successfully");
      setShowDialog(false);
      setEditingFaq(null);
      setFormData(DEFAULT_FORM);
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save FAQ");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return faqsApi.delete(id);
    },
    onSuccess: () => {
      toast.success("FAQ deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete FAQ");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return faqsApi.toggleStatus(id, active);
    },
    onSuccess: () => {
      toast.success("FAQ status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to toggle status");
    },
  });

  const openAddDialog = () => {
    setEditingFaq(null);
    setFormData(DEFAULT_FORM);
    setShowDialog(true);
  };

  const openEditDialog = (faq: FaqDto) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "General",
      order: faq.order || 0,
      active: faq.active,
    });
    setShowDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Please enter both question and answer");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Frequently Asked Questions (FAQ)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage public website FAQs, categories, and display order dynamically.
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total FAQs</p>
              <h3 className="text-2xl font-bold mt-1">{faqs.length}</h3>
            </div>
            <HelpCircle className="h-8 w-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active on Website</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">
                {faqs.filter((f) => f.active).length}
              </h3>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Inactive / Draft</p>
              <h3 className="text-2xl font-bold mt-1 text-muted-foreground">
                {faqs.filter((f) => !f.active).length}
              </h3>
            </div>
            <XCircle className="h-8 w-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs by question, answer, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>All FAQs ({faqs.length})</span>
            {isLoading && <span className="text-xs text-muted-foreground">Loading FAQs...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          {faqs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <HelpCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-base font-semibold">No FAQs Found</h4>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? "No FAQs match your search criteria. Try a different query."
                  : "No FAQs added yet. Click 'Add FAQ' to create your first dynamic FAQ."}
              </p>
              {!searchTerm && (
                <Button onClick={openAddDialog} variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add First FAQ
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {faqs.map((faq) => (
                <div
                  key={faq._id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-muted/40 transition"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {faq.category || "General"}
                      </span>
                      <span className="text-xs text-muted-foreground">Order: #{faq.order || 0}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          faq.active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {faq.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <h3 className="font-semibold text-base text-foreground leading-snug">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-2 sm:pt-0">
                    <div className="flex items-center gap-2 mr-2">
                      <Label htmlFor={`status-${faq._id}`} className="text-xs text-muted-foreground cursor-pointer">
                        {faq.active ? "Enabled" : "Disabled"}
                      </Label>
                      <Switch
                        id={`status-${faq._id}`}
                        checked={faq.active}
                        onCheckedChange={(checked) =>
                          toggleStatusMutation.mutate({ id: faq._id, active: checked })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(faq)}
                      title="Edit FAQ"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this FAQ?")) {
                          deleteMutation.mutate(faq._id);
                        }
                      }}
                      title="Delete FAQ"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
            <DialogDescription>
              {editingFaq
                ? "Update FAQ details. Changes will reflect dynamically on the website."
                : "Create a new FAQ record stored dynamically in the database."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="faq-question">Question *</Label>
              <Input
                id="faq-question"
                placeholder="e.g. How long does homeopathic treatment take?"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faq-answer">Answer *</Label>
              <Textarea
                id="faq-answer"
                rows={4}
                placeholder="Enter detailed answer here..."
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faq-category">Category</Label>
                <Input
                  id="faq-category"
                  placeholder="e.g. Treatments, Booking"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faq-order">Display Order</Label>
                <Input
                  id="faq-order"
                  type="number"
                  placeholder="0"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="faq-active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="faq-active">Active (Visible on public website)</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingFaq ? "Save Changes" : "Create FAQ"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
