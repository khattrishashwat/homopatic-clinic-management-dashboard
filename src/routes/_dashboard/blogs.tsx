import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Edit,
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
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
import { blogsApi, categoriesApi, type CategoryDto, type BlogDto } from "@/services/adminApi";
import { formatDate } from "@/lib/format";
import { getAssetUrl } from "@/utils/httpsclient";

export const Route = createFileRoute("/_dashboard/blogs")({
  component: BlogsPage,
});

function BlogsPage() {
  const queryClient = useQueryClient();
   const blogsQuery = useQuery({
     queryKey: ["blogs"],
     queryFn: () => blogsApi.list({ limit: 50 }),
   });
   const blogs = blogsQuery.data?.data || [];

   // Fetch categories for dropdown
   const { data: categoriesData } = useQuery({
     queryKey: ["categories"],
     queryFn: () => categoriesApi.list(),
   });
   const categories = (categoriesData || []).filter((c: CategoryDto) => c.type === 'blog' || c.type === 'both');

   const [editing, setEditing] = useState<BlogDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("content");

  const imageInputRef = useRef<HTMLInputElement>(null);

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const blogFormData = new FormData();

      // Content fields
      blogFormData.append("title", String(formData.get("title") || ""));
      blogFormData.append("excerpt", String(formData.get("excerpt") || ""));
      blogFormData.append("content", String(formData.get("content") || ""));
      blogFormData.append("category", String(formData.get("category") || ""));
      blogFormData.append("author", String(formData.get("author") || "Homeopathy Team"));
      blogFormData.append("author_bio", String(formData.get("author_bio") || ""));

       // Tags
       const tags = String(formData.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean);
       blogFormData.append("tags", tags.join(","));

       // featured_image_alt
       blogFormData.append("featured_image_alt", String(formData.get("featured_image_alt") || ""));

       // Status
      blogFormData.append("published", formData.get("published") === "on" ? "true" : "false");
      blogFormData.append("featured", formData.get("featured") === "on" ? "true" : "false");

      // Image
      if (imageFile) {
        blogFormData.append("featured_image", imageFile);
      }

      if (editing) {
        return blogsApi.update(editing._id, blogFormData);
      } else {
        return blogsApi.create(blogFormData);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Blog updated" : "Blog created");
      setShowForm(false);
      setEditing(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to save blog");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: blogsApi.delete,
    onSuccess: () => {
      toast.success("Blog deleted");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete blog");
    },
  });

  const openForm = (blog?: BlogDto) => {
    if (blog) {
      setEditing(blog);
      setImagePreview(blog.featured_image ? getAssetUrl(blog.featured_image) : null);
    } else {
      setEditing(null);
      setImagePreview(null);
    }
    setShowForm(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setActiveTab("content");
  };

  // Simple rich text editor toolbar commands
  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage blog posts</p>
        </div>
        <Button size="sm" onClick={() => openForm()}>
          <Plus className="mr-1 h-4 w-4" /> New Post
        </Button>
      </div>

      {blogsQuery.isLoading && (
        <div className="flex justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading blogs...</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <Card key={blog._id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              {blog.featured_image ? (
                <div className="mb-3 h-40 w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={getAssetUrl(blog.featured_image)}
                    alt={blog.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-3 flex items-center justify-center h-40 rounded-lg bg-muted">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  blog.published
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {blog.published ? "Published" : "Draft"}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(blog.published_at || blog.createdAt)}</span>
              </div>

              <h3 className="font-semibold text-foreground line-clamp-2">{blog.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{blog.excerpt}</p>
              <p className="mt-2 font-mono text-xs text-primary">/{blog.slug}</p>
              <p className="mt-1 text-xs text-muted-foreground">Category: {blog.category?.name || "Uncategorized"}</p>

              <div className="mt-3 flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => openForm(blog)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this blog?")) {
                      deleteMutation.mutate(blog._id);
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

      {!blogsQuery.isLoading && blogs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No blogs yet</h3>
          <p className="text-sm text-muted-foreground">Get started by creating your first blog post</p>
          <Button className="mt-4" onClick={() => openForm()}>
            <Plus className="mr-1 h-4 w-4" /> Create Blog
          </Button>
        </div>
      )}

      {/* Blog Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) {
          setEditing(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>{editing ? "Edit Blog" : "Create Blog"}</DialogTitle>
             <DialogDescription>
               Create and manage blog posts
             </DialogDescription>
           </DialogHeader>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(new FormData(e.currentTarget)); }}>
            {/* Tab Navigation */}
            <div className="flex border-b">
              {["content", "publish"].map((tab) => (
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

            {/* Content Tab */}
            {activeTab === "content" && (
              <div className="space-y-4">
                {/* Featured Image */}
                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="h-48 w-full rounded-lg object-cover border" />
                      <Button type="button" size="icon" variant="destructive" className="absolute right-2 top-2 h-6 w-6" onClick={removeImage}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <Upload className="mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload featured image</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                   <Input name="featured_image_alt" placeholder="Image alt text for accessibility" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required placeholder="Enter blog title" defaultValue={editing?.title} />
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt (short summary)</Label>
                  <Textarea id="excerpt" name="excerpt" placeholder="Brief description shown in listings" defaultValue={editing?.excerpt} rows={2} maxLength={300} />
                </div>

                {/* Rich Text Editor Toolbar */}
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => execCmd("bold")}>
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => execCmd("italic")}>
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => execCmd("insertUnorderedList")}>
                      <List className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => {
                      const url = prompt("Enter URL:");
                      if (url) execCmd("createLink", url);
                    }}>
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    name="content"
                    required
                    placeholder="Write your blog content here... (Supports HTML)"
                    defaultValue={editing?.content}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can use HTML tags: &lt;h1&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, &lt;img&gt;, &lt;table&gt;, etc.
                  </p>
                </div>

                 {/* Category */}
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

                {/* Author */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Author Name</Label>
                    <Input id="author" name="author" placeholder="e.g., Dr. John Doe" defaultValue={editing?.author || "Homeopathy Team"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author_bio">Author Bio</Label>
                    <Input id="author_bio" name="author_bio" placeholder="Brief author bio" defaultValue={editing?.author_bio} />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="homeopathy, health, wellness"
                    defaultValue={editing?.tags?.join(", ")}
                  />
                </div>
               </div>
             )}

             {/* Publish Tab */}
            {activeTab === "publish" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="published" className="text-base">Publish Now</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this blog visible to the public
                    </p>
                  </div>
                  <Switch
                    name="published"
                    defaultChecked={editing?.published}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="featured" className="text-base">Featured Post</Label>
                    <p className="text-sm text-muted-foreground">
                      Showcase on homepage or featured sections
                    </p>
                  </div>
                  <Switch
                    name="featured"
                    defaultChecked={editing?.featured}
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
                {saveMutation.isPending ? "Saving..." : editing ? "Update Blog" : "Create Blog"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
