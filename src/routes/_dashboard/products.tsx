import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Edit,
  Package,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Table,
  AlignLeft,
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
import { productsApi, categoriesApi, type CategoryDto } from "@/services/adminApi";
import { formatCurrency } from "@/lib/format";
import { getAssetUrl } from "@/utils/httpsclient";

export const Route = createFileRoute("/_dashboard/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

   const productsQuery = useQuery({
     queryKey: ["products"],
     queryFn: () => productsApi.list({ limit: 50 }),
   });
   const products = productsQuery.data?.data || [];

   // Fetch categories for dropdown
   const { data: categoriesData } = useQuery({
     queryKey: ["categories"],
     queryFn: () => categoriesApi.list(),
   });
   const categories = (categoriesData || []).filter((c: CategoryDto) => c.type === 'product' || c.type === 'both');

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const productFormData = new FormData();

      // Basic fields
      productFormData.append("name", String(formData.get("name") || ""));
      productFormData.append("slug", String(formData.get("slug") || ""));
      productFormData.append("short_description", String(formData.get("short_description") || ""));
      productFormData.append("description", String(formData.get("description") || ""));
      productFormData.append("price", Number(formData.get("price") || 0));
      productFormData.append("compare_price", Number(formData.get("compare_price") || 0) || "");
      productFormData.append("stock", Number(formData.get("stock") || 0));
      productFormData.append("sku", String(formData.get("sku") || ""));
      productFormData.append("category", String(formData.get("category") || ""));

      // Image alt text
      productFormData.append("image_alt", String(formData.get("image_alt") || ""));

      // Attributes (JSON)
      const attributes = {
        benefits: formData.get("benefits")?.toString().split("\n").filter(Boolean) || [],
        ingredients: formData.get("ingredients")?.toString().split("\n").filter(Boolean) || [],
        usage: formData.get("usage") || "",
        faqs: parseFAQs(formData.get("faqs")?.toString() || ""),
        shortDescription: formData.get("short_description") || "",
      };
      productFormData.append("attributes", JSON.stringify(attributes));

       // Status
      productFormData.append("active", formData.get("active") === "on" ? "true" : "false");
      productFormData.append("featured", formData.get("featured") === "on" ? "true" : "false");

      // Images
      if (mainImageFile) {
        productFormData.append("image", mainImageFile);
      }
      if (galleryFiles.length > 0) {
        galleryFiles.forEach((file) => {
          productFormData.append("gallery", file);
        });
      }

      if (editing) {
        return productsApi.update(editing._id, productFormData);
      } else {
        return productsApi.create(productFormData);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      setShowForm(false);
      setEditing(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save product");
    },
  });

  const parseFAQs = (text: string) => {
    return text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [q, ...aParts] = line.split("?");
        if (q && aParts.length > 0) {
          return { q: q.trim() + "?", a: aParts.join("?").trim() };
        }
        return null;
      })
      .filter(Boolean);
  };

  const resetForm = () => {
    setMainImageFile(null);
    setMainImagePreview(null);
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setActiveTab("basic");
  };

  const openForm = (product?: ProductDto) => {
    if (product) {
      setEditing(product);
      setMainImagePreview(getAssetUrl(product.image));
      const attrs = product.attributes || {};
      const faqs = attrs.faqs || [];
      const faqText = faqs.map((f: { q: string; a: string }) => `${f.q} ${f.a}`).join("\n");

      // Pre-fill form via data attributes or state (simplified)
      // In production, use a form library like react-hook-form
    } else {
      setEditing(null);
      setMainImagePreview(null);
    }
    setShowForm(true);
    setGalleryFiles([]);
    setGalleryPreviews([]);
  };

  const handleMainImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      setMainImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...galleryFiles, ...files].slice(0, 10);
      setGalleryFiles(newFiles);

      const readers = files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      );
      Promise.all(readers).then((newPreviews) => {
        setGalleryPreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
      });
    }
  };

  const removeMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview(null);
    if (mainImageInputRef.current) mainImageInputRef.current.value = "";
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(new FormData(event.currentTarget));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage clinic products and packages</p>
        </div>
        <Button size="sm" onClick={() => openForm()}>
          <Plus className="mr-1 h-4 w-4" /> Add Product
        </Button>
      </div>

      {productsQuery.isLoading && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      )}

      {!productsQuery.isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No products yet</h3>
          <p className="text-sm text-muted-foreground">Get started by adding your first product</p>
          <Button className="mt-4" onClick={() => openForm()}>
            <Plus className="mr-1 h-4 w-4" /> Add Product
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product._id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              {product.image ? (
                <div className="mb-3 h-40 w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={getAssetUrl(product.image)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-3 flex items-start justify-between">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  {product.featured && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                </div>
              )}

              <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {product.category?.name || "Uncategorized"} · Stock: {product.stock || 0}
              </p>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-primary">{formatCurrency(product.price)}</span>
                {product.compare_price && product.compare_price > product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(product.compare_price)}
                  </span>
                )}
              </div>

              <div className="mt-3 flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => openForm(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this product?")) {
                      deleteMutation.mutate(product._id);
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

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) {
          setEditing(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
             <DialogDescription>
               Fill in the product details
             </DialogDescription>
           </DialogHeader>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Tab Navigation */}
            <div className="flex border-b">
              {["basic", "advanced"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`px-4 py-2 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="space-y-2">
                  <Label>Product Image *</Label>
                  {mainImagePreview ? (
                    <div className="relative">
                      <img
                        src={mainImagePreview}
                        alt="Preview"
                        className="h-48 w-full rounded-lg object-cover border"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={removeMainImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors"
                      onClick={() => mainImageInputRef.current?.click()}
                    >
                      <Upload className="mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload main image</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input
                    ref={mainImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageSelect}
                    className="hidden"
                  />
                   <Input name="image_alt" placeholder="Image alt text for accessibility" />
                </div>

                {/* Gallery Images */}
                <div className="space-y-2">
                  <Label>Gallery Images (max 10)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {galleryPreviews.map((preview, i) => (
                      <div key={i} className="relative">
                        <img
                          src={preview}
                          alt={`Gallery ${i + 1}`}
                          className="h-20 w-full rounded object-cover"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute right-1 top-1 h-5 w-5"
                          onClick={() => removeGalleryImage(i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {galleryPreviews.length < 10 && (
                      <div
                        className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGallerySelect}
                    className="hidden"
                  />
                </div>

                {/* Name & Slug */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="e.g., Vitamin C Serum"
                      defaultValue={editing?.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      placeholder="auto-generated-if-empty"
                      defaultValue={editing?.slug}
                    />
                  </div>
                </div>

                 {/* Category & SKU */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="category">Category</Label>
                     <Select name="category" defaultValue={editing?.category?._id || editing?.category || ""}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select category" />
                       </SelectTrigger>
                       <SelectContent>
                         {categories.map((cat: CategoryDto) => (
                           <SelectItem key={cat._id} value={cat._id}>
                             {cat.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                     <Input
                       id="sku"
                       name="sku"
                       placeholder="e.g., SKU-001"
                       defaultValue={editing?.sku}
                     />
                   </div>
                 </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea
                    id="short_description"
                    name="short_description"
                    placeholder="Brief product summary"
                    defaultValue={editing?.short_description}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Detailed product description"
                    defaultValue={editing?.description}
                    rows={4}
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (INR) *</Label>
                    <Input
                      id="price"
                      name="price"
                      required
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={editing?.price}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compare_price">MRP / Compare Price</Label>
                    <Input
                      id="compare_price"
                      name="compare_price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={editing?.compare_price}
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      placeholder="0"
                      defaultValue={editing?.stock || 0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="in_stock">Status</Label>
                    <Select name="active" defaultValue={editing?.active !== false ? "true" : "false"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-2">
                  <Label htmlFor="benefits">Benefits (one per line)</Label>
                  <Textarea
                    id="benefits"
                    name="benefits"
                    placeholder="Benefit 1&#10;Benefit 2&#10;Benefit 3"
                    defaultValue={editing?.attributes?.benefits?.join("\n") || ""}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ingredients">Ingredients (one per line)</Label>
                  <Textarea
                    id="ingredients"
                    name="ingredients"
                    placeholder="Ingredient 1&#10;Ingredient 2"
                    defaultValue={editing?.attributes?.ingredients?.join("\n") || ""}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="category">Category</Label>
                     <Select name="category" defaultValue={editing?.category?._id || editing?.category || ""}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select category" />
                       </SelectTrigger>
                       <SelectContent>
                         {categories.map((cat: CategoryDto) => (
                           <SelectItem key={cat._id} value={cat._id}>
                             {cat.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Course Duration (weeks)</Label>
                    <Input
                      id="duration"
                      name="durationWeeks"
                      type="number"
                      placeholder="8"
                      defaultValue={editing?.attributes?.durationWeeks || 8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faqs">FAQs (Format: Question? Answer)</Label>
                  <Textarea
                    id="faqs"
                    name="faqs"
                    placeholder="What is this? This is a product for...&#10;How to use? Take as directed..."
                    defaultValue={(editing?.attributes?.faqs || [])
                      .map((f: { q: string; a: string }) => `${f.q} ${f.a}`)
                      .join("\n")}
                    rows={3}
                  />
                </div>
               </div>
             )}

             {/* Advanced Tab */}
            {activeTab === "advanced" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="featured" className="text-base">Featured Product</Label>
                    <p className="text-sm text-muted-foreground">
                      Showcase on homepage or featured sections
                    </p>
                  </div>
                  <Switch
                    name="featured"
                    defaultChecked={editing?.featured}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="active" className="text-base">Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Make product visible on website
                    </p>
                  </div>
                  <Switch
                    name="active"
                    defaultChecked={editing?.active ?? true}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editing ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
