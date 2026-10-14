import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Edit, FolderPlus, Trash2, Search, HeartPulse, CheckCircle2 } from "lucide-react";
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
import { categoriesApi, type CategoryDto } from "@/services/adminApi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/categories")({
  component: CategoriesPage,
});

interface CategoryFormData {
  name: string;
  description: string;
  type: "blog" | "product" | "both" | "health_concern";
  active: boolean;
}

function CategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    type: "both",
    active: true,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });
  const categories = categoriesQuery.data?.data || [];

  const filteredCategories = useMemo(() => {
    return categories.filter((category: CategoryDto) => {
      const matchType =
        filterType === "all" ? true :
        filterType === "health_concern" ? category.type === "health_concern" :
        filterType === "both" ? category.type === "both" :
        filterType === "product" ? category.type === "product" :
        filterType === "blog" ? category.type === "blog" : true;

      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        category.name.toLowerCase().includes(q) ||
        (category.description && category.description.toLowerCase().includes(q)) ||
        (category.slug && category.slug.toLowerCase().includes(q));

      return matchType && matchSearch;
    });
  }, [categories, filterType, searchTerm]);

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (editing) {
        return categoriesApi.update(editing._id, data);
      } else {
        return categoriesApi.create(data);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Category updated" : "Category created");
      setShowForm(false);
      setEditing(null);
      setFormData({ name: "", description: "", type: "both", active: true });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to save category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return categoriesApi.delete(id);
    },
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Failed to delete category");
    },
  });

  const openForm = (category?: CategoryDto) => {
    if (category) {
      setEditing(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        type: (category.type as CategoryFormData["type"]) || "both",
        active: category.active !== undefined ? category.active : true,
      });
    } else {
      setEditing(null);
      setFormData({
        name: "",
        description: "",
        type: filterType === "health_concern" ? "health_concern" : "both",
        active: true,
      });
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CategoryFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize products, blogs, and patient health concerns
          </p>
        </div>
        <Button size="sm" onClick={() => openForm()} className="shrink-0">
          <FolderPlus className="mr-1 h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
          {[
            { id: "all", label: `All (${categories.length})` },
            { id: "health_concern", label: `Health Concerns (${categories.filter(c => c.type === "health_concern").length})` },
            { id: "both", label: `Products & Blogs (${categories.filter(c => c.type === "both").length})` },
            { id: "product", label: `Products Only (${categories.filter(c => c.type === "product").length})` },
            { id: "blog", label: `Blogs Only (${categories.filter(c => c.type === "blog").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                filterType === tab.id
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {categoriesQuery.isLoading && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category: CategoryDto) => (
          <Card key={category._id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                  category.type === "health_concern"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40"
                    : category.type === "product"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    : category.type === "blog"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                )}>
                  {category.type === "health_concern"
                    ? "Health Concern"
                    : category.type === "both"
                    ? "Products & Blogs"
                    : category.type === "product"
                    ? "Products Only"
                    : category.type === "blog"
                    ? "Blogs Only"
                    : category.type}
                </span>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {category.description || "No description provided."}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  category.active ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}>
                  {category.active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-muted-foreground">Slug: {category.slug}</span>
              </div>

              {category.type === "health_concern" && (
                <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 shrink-0" /> Visible in &ldquo;What&apos;s your health concern?&rdquo; list
                </div>
              )}

              <div className="mt-3 flex justify-end gap-1 border-t pt-2">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openForm(category)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete category "${category.name}"?`)) {
                      deleteMutation.mutate(category._id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!categoriesQuery.isLoading && filteredCategories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
          <FolderPlus className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {searchTerm || filterType !== "all" ? "No matching categories" : "No categories yet"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search terms or filter."
              : "Create categories to organize your products, blogs, and patient health concerns."}
          </p>
          <Button size="sm" onClick={() => openForm()} className="mt-4">
            <FolderPlus className="mr-1 h-4 w-4" /> Add Category
          </Button>
        </div>
      )}

      {/* Category Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              Organize products, blogs, or appointment health concerns with categories.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                placeholder="e.g., Hair Fall, Thyroid, Skincare, PCOD..." 
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Brief description of this category" 
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Category Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleInputChange("type", value as CategoryFormData["type"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health_concern">Health Concern (Appointment List)</SelectItem>
                    <SelectItem value="both">Products & Blogs</SelectItem>
                    <SelectItem value="product">Products Only</SelectItem>
                    <SelectItem value="blog">Blogs Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={formData.active}
                    onCheckedChange={(checked) => handleInputChange("active", checked)}
                  />
                  <Label>Active (Visible to users)</Label>
                </div>
              </div>
            </div>

            {formData.type === "health_concern" && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-300/50 flex items-start gap-2">
                <HeartPulse className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <strong>Health Concern Category:</strong> Categories saved with this type will appear automatically on the website in Step 1 (&ldquo;What&apos;s your health concern?&rdquo;) for patients booking an appointment.
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
