import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Edit, FolderPlus, Trash2, ImageIcon } from "lucide-react";
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
import httpClient from "@/utils/httpsclient";
import type { ApiResponse } from "@/utils/httpsclient";

export const Route = createFileRoute("/_dashboard/categories")({
  component: CategoriesPage,
});

interface CategoryDto {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  type: "blog" | "product" | "both";
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  type: "blog" | "product" | "both";
  active: boolean;
}

function CategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    type: "both",
    active: true,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await httpClient.get<ApiResponse<CategoryDto[]>>("/admin/categories");
      return response.data;
    },
  });
  const categories = categoriesQuery.data || [];

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (editing) {
        const response = await httpClient.patch<CategoryDto>(`/admin/categories/${editing._id}`, data);
        return response.data;
      } else {
        const response = await httpClient.post<CategoryDto>("/admin/categories", data);
        return response.data;
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
      const response = await httpClient.delete<{ message: string }>(`/admin/categories/${id}`);
      return response.data;
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
        type: category.type,
        active: category.active,
      });
    } else {
      setEditing(null);
      setFormData({ name: "", description: "", type: "both", active: true });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize products and blogs with categories</p>
        </div>
        <Button size="sm" onClick={() => openForm()}>
          <FolderPlus className="mr-1 h-4 w-4" /> Add Category
        </Button>
      </div>

      {categoriesQuery.isLoading && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category: CategoryDto) => (
          <Card key={category._id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground">{category.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  category.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {category.active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{category.type}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Slug: {category.slug}</p>

              <div className="mt-3 flex justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openForm(category)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this category? This may affect products/blogs.")) {
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

      {!categoriesQuery.isLoading && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderPlus className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No categories yet</h3>
          <p className="text-sm text-muted-foreground">Create categories to organize your content</p>
        </div>
      )}

      {/* Category Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              Organize products and blogs with categories
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                placeholder="e.g., Skincare" 
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Brief description" 
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleInputChange("type", value as CategoryFormData["type"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Products & Blogs</SelectItem>
                    <SelectItem value="product">Products Only</SelectItem>
                    <SelectItem value="blog">Blogs Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={formData.active}
                    onCheckedChange={(checked) => handleInputChange("active", checked)}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}