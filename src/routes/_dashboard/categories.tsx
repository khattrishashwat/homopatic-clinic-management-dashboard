import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Edit, FolderPlus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
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
import { categoriesApi } from "@/services/adminApi";
import { getAssetUrl } from "@/utils/httpsclient";

export const Route = createFileRoute("/_dashboard/categories")({
  component: CategoriesPage,
});

interface CategoryDto {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_alt?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  canonical_url?: string;
  active: boolean;
  type: "blog" | "product" | "both";
  createdAt?: string;
  updatedAt?: string;
}

// function CategoriesPage() {
//   const queryClient = useQueryClient();
//   const [editing, setEditing] = useState<CategoryDto | null>(null);
//   const [showForm, setShowForm] = useState(false);
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);

//   const categoriesQuery = useQuery({
//     queryKey: ["categories"],
//     queryFn: () => categoriesApi.list(),
//   });
//   const categories = categoriesQuery.data || [];

//   const saveMutation = useMutation({
//     mutationFn: async (formData: FormData) => {
//       const catFormData = new FormData();
//       catFormData.append("name", String(formData.get("name") || ""));
//       catFormData.append("description", String(formData.get("description") || ""));
//       catFormData.append("image_alt", String(formData.get("image_alt") || ""));
//       catFormData.append("seo_title", String(formData.get("seo_title") || ""));
//       catFormData.append("seo_description", String(formData.get("seo_description") || ""));
//       catFormData.append("seo_keywords", String(formData.get("seo_keywords") || ""));
//       catFormData.append("canonical_url", String(formData.get("canonical_url") || ""));
//       catFormData.append("type", String(formData.get("type") || "both"));
//       catFormData.append(
//         "active",
//         formData.get("active") === "on" || formData.get("active") === true ? "true" : "false"
//       );

//       if (imageFile) {
//         catFormData.append("image", imageFile);
//       }

//       if (editing) {
//         return categoriesApi.update(editing._id, catFormData);
//       } else {
//         return categoriesApi.create(catFormData);
//       }
//     },
//     onSuccess: () => {
//       toast.success(editing ? "Category updated" : "Category created");
//       setShowForm(false);
//       setEditing(null);
//       resetForm();
//       queryClient.invalidateQueries({ queryKey: ["categories"] });
//     },
//     onError: (error: any) => {
//       toast.error(error?.message || "Failed to save category");
//     },
//   });

//   const deleteMutation = useMutation({
//     mutationFn: categoriesApi.delete,
//     onSuccess: () => {
//       toast.success("Category deleted");
//       queryClient.invalidateQueries({ queryKey: ["categories"] });
//     },
//     onError: (error: any) => {
//       toast.error(error?.message || "Failed to delete category");
//     },
//   });

//   const openForm = (category?: CategoryDto) => {
//     if (category) {
//       setEditing(category);
//       setImagePreview(category.image ? getAssetUrl(category.image) : null);
//     } else {
//       setEditing(null);
//       setImagePreview(null);
//     }
//     setShowForm(true);
//   };

//   const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       if (file.size > 2 * 1024 * 1024) {
//         toast.error("Image size should be less than 2MB");
//         return;
//       }
//       setImageFile(file);
//       const reader = new FileReader();
//       reader.onloadend = () => setImagePreview(reader.result as string);
//       reader.readAsDataURL(file);
//     }
//   };

//   const resetForm = () => {
//     setImageFile(null);
//     setImagePreview(null);
//   };

//   return (
//     <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">Categories</h1>
//           <p className="text-sm text-muted-foreground">Organize products and blogs with categories</p>
//         </div>
//         <Button size="sm" onClick={() => openForm()}>
//           <FolderPlus className="mr-1 h-4 w-4" /> Add Category
//         </Button>
//       </div>

//       {categoriesQuery.isLoading && (
//         <div className="flex justify-center py-8">
//           <p className="text-sm text-muted-foreground">Loading categories...</p>
//         </div>
//       )}

//       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
//         {categories.map((category: CategoryDto) => (
//           <Card key={category._id} className="transition-shadow hover:shadow-md">
//             <CardContent className="p-5">
//               {category.image ? (
//                 <div className="mb-3 h-24 w-full overflow-hidden rounded-lg bg-gray-100">
//                   <img
//                     src={getAssetUrl(category.image)}
//                     alt={category.name}
//                     className="h-full w-full object-cover"
//                   />
//                 </div>
//               ) : (
//                 <div className="mb-3 flex items-center justify-center h-24 rounded-lg bg-muted">
//                   <ImageIcon className="h-8 w-8 text-muted-foreground" />
//                 </div>
//               )}

//               <h3 className="font-semibold text-foreground">{category.name}</h3>
//               <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
//               <div className="mt-2 flex items-center gap-2">
//                 <span className={`text-xs px-2 py-0.5 rounded-full ${
//                   category.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
//                 }`}>
//                   {category.active ? "Active" : "Inactive"}
//                 </span>
//                 <span className="text-xs text-muted-foreground capitalize">{category.type}</span>
//               </div>

//               <div className="mt-3 flex justify-end gap-1">
//                 <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openForm(category)}>
//                   <Edit className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   size="icon"
//                   variant="ghost"
//                   className="h-8 w-8 text-destructive hover:text-destructive"
//                   onClick={() => {
//                     if (confirm("Delete this category? This may affect products/blogs.")) {
//                       deleteMutation.mutate(category._id);
//                     }
//                   }}
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {!categoriesQuery.isLoading && categories.length === 0 && (
//         <div className="flex flex-col items-center justify-center py-12 text-center">
//           <FolderPlus className="mb-4 h-12 w-12 text-muted-foreground" />
//           <h3 className="text-lg font-semibold">No categories yet</h3>
//           <p className="text-sm text-muted-foreground">Create categories to organize your content</p>
//         </div>
//       )}

//       {/* Category Form Dialog */}
//       <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditing(null); resetForm(); } }}>
//         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>{editing ? "Edit Category" : "Create Category"}</DialogTitle>
//             <DialogDescription>
//               Add SEO information for better search visibility
//             </DialogDescription>
//           </DialogHeader>

//           <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(new FormData(e.currentTarget)); }}>
//             <div className="space-y-2">
//               <Label htmlFor="name">Category Name *</Label>
//               <Input id="name" name="name" required placeholder="e.g., Skincare" defaultValue={editing?.name} />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="description">Description</Label>
//               <Textarea id="description" name="description" placeholder="Brief description" defaultValue={editing?.description} rows={2} />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="type">Type</Label>
//                 <Select name="type" defaultValue={editing?.type || "both"}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="both">Products & Blogs</SelectItem>
//                     <SelectItem value="product">Products Only</SelectItem>
//                     <SelectItem value="blog">Blogs Only</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="flex items-end">
//                 <div className="flex items-center space-x-2">
//                   <Switch name="active" defaultChecked={editing?.active ?? true} />
//                   <Label>Active</Label>
//                 </div>
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label>Category Image</Label>
//               {imagePreview ? (
//                 <div className="relative">
//                   <img src={imagePreview} alt="Preview" className="h-32 w-full rounded-lg object-cover border" />
//                   <Button type="button" size="icon" variant="destructive" className="absolute right-2 top-2 h-6 w-6" onClick={() => { setImageFile(null); setImagePreview(null); }}>
//                     <X className="h-3 w-3" />
//                   </Button>
//                 </div>
//               ) : (
//                 <div
//                   className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary"
//                   onClick={() => document.getElementById("category-image")?.click()}
//                 >
//                   <Upload className="mb-2 h-6 w-6 text-gray-400" />
//                   <p className="text-xs text-gray-500">Upload category image</p>
//                 </div>
//               )}
//               <input id="category-image" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="image_alt">Image Alt Text</Label>
//               <Input id="image_alt" name="image_alt" placeholder="Descriptive alt text" defaultValue={editing?.image_alt} />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="seo_title">SEO Title</Label>
//               <Input id="seo_title" name="seo_title" placeholder="SEO-friendly title" defaultValue={editing?.seo_title} />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="seo_description">SEO Description</Label>
//               <Textarea id="seo_description" name="seo_description" placeholder="Meta description" defaultValue={editing?.seo_description} rows={2} maxLength={160} />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="seo_keywords">SEO Keywords (comma-separated)</Label>
//               <Input id="seo_keywords" name="seo_keywords" placeholder="keyword1, keyword2" defaultValue={editing?.seo_keywords?.join(", ")} />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="canonical_url">Canonical URL</Label>
//               <Input id="canonical_url" name="canonical_url" placeholder="https://example.com/category" defaultValue={editing?.canonical_url} />
//             </div>

//             <div className="flex justify-end gap-2 pt-4 border-t">
//               <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }}>
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={saveMutation.isPending}>
//                 {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
//               </Button>
//             </div>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </motion.div>
//   );
// }

function CategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/admin/categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      return data;
    },
  });
  const categories = categoriesQuery.data?.data || [];

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const catFormData = new FormData();
      catFormData.append("name", String(formData.get("name") || ""));
      catFormData.append("description", String(formData.get("description") || ""));
      catFormData.append("image_alt", String(formData.get("image_alt") || ""));
      catFormData.append("seo_title", String(formData.get("seo_title") || ""));
      catFormData.append("seo_description", String(formData.get("seo_description") || ""));
      catFormData.append("seo_keywords", String(formData.get("seo_keywords") || ""));
      catFormData.append("canonical_url", String(formData.get("canonical_url") || ""));
      catFormData.append("type", String(formData.get("type") || "both"));
      catFormData.append("active", formData.get("active") === "on" ? "true" : "false");

      if (imageFile) {
        catFormData.append("image", imageFile);
      }

      const token = localStorage.getItem("token");
      const url = editing
        ? `http://localhost:5000/api/admin/categories/${editing._id}`
        : "http://localhost:5000/api/admin/categories";

      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        body: catFormData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save category");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(editing ? "Category updated" : "Category created");
      setShowForm(false);
      setEditing(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete category");
    },
  });

  const openForm = (category?: CategoryDto) => {
    if (category) {
      setEditing(category);
      setImagePreview(category.image ? `http://localhost:5000${category.image}` : null);
    } else {
      setEditing(null);
      setImagePreview(null);
    }
    setShowForm(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
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
              {category.image ? (
                <div className="mb-3 h-24 w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={`http://localhost:5000${category.image}`}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-3 flex items-center justify-center h-24 rounded-lg bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

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
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditing(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              Add SEO information for better search visibility
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(new FormData(e.currentTarget)); }}>
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input id="name" name="name" required placeholder="e.g., Skincare" defaultValue={editing?.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief description" defaultValue={editing?.description} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue={editing?.type || "both"}>
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
                  <Switch name="active" defaultChecked={editing?.active ?? true} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category Image</Label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="h-32 w-full rounded-lg object-cover border" />
                  <Button type="button" size="icon" variant="destructive" className="absolute right-2 top-2 h-6 w-6" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary"
                  onClick={() => document.getElementById("category-image")?.click()}
                >
                  <Upload className="mb-2 h-6 w-6 text-gray-400" />
                  <p className="text-xs text-gray-500">Upload category image</p>
                </div>
              )}
              <input id="category-image" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_alt">Image Alt Text</Label>
              <Input id="image_alt" name="image_alt" placeholder="Descriptive alt text" defaultValue={editing?.image_alt} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input id="seo_title" name="seo_title" placeholder="SEO-friendly title" defaultValue={editing?.seo_title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea id="seo_description" name="seo_description" placeholder="Meta description" defaultValue={editing?.seo_description} rows={2} maxLength={160} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_keywords">SEO Keywords (comma-separated)</Label>
              <Input id="seo_keywords" name="seo_keywords" placeholder="keyword1, keyword2" defaultValue={editing?.seo_keywords?.join(", ")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="canonical_url">Canonical URL</Label>
              <Input id="canonical_url" name="canonical_url" placeholder="https://example.com/category" defaultValue={editing?.canonical_url} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }}>
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
