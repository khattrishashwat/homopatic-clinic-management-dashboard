import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { blogsApi } from "@/services/adminApi";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/blogs")({
  component: BlogsPage,
});

function BlogsPage() {
  const queryClient = useQueryClient();
  const blogsQuery = useQuery({ queryKey: ["blogs"], queryFn: () => blogsApi.list({ limit: 50 }) });
  const blogs = blogsQuery.data?.data || [];
  const deleteMutation = useMutation({
    mutationFn: blogsApi.delete,
    onSuccess: () => {
      toast.success("Blog deleted");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Blog Management</h1><p className="text-sm text-muted-foreground">Create and manage blog posts</p></div>
        <Button size="sm" disabled><Plus className="mr-1 h-4 w-4" /> New Post</Button>
      </div>
      {blogsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading blogs...</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <Card key={blog._id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-2 flex items-start justify-between">
                <StatusBadge status={blog.published ? "published" : "draft"} />
                <span className="text-xs text-muted-foreground">{formatDate(blog.published_at || blog.createdAt)}</span>
              </div>
              <h3 className="mt-2 font-semibold text-foreground">{blog.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{blog.excerpt}</p>
              <p className="mt-2 font-mono text-xs text-primary">/{blog.slug}</p>
              <div className="mt-3 flex justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled><Edit className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(blog._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!blogsQuery.isLoading && blogs.length === 0 && <p className="text-sm text-muted-foreground">No blogs found</p>}
    </motion.div>
  );
}
