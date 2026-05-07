import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { mockBlogs } from "@/lib/mock-data";

export const Route = createFileRoute("/_dashboard/blogs")({
  component: () => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Blog Management</h1><p className="text-sm text-muted-foreground">Create and manage blog posts</p></div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Post</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockBlogs.map((b) => (
          <Card key={b.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <StatusBadge status={b.status} />
                <span className="text-xs text-muted-foreground">{b.date}</span>
              </div>
              <h3 className="font-semibold text-foreground mt-2">{b.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.excerpt}</p>
              <p className="text-xs text-primary mt-2 font-mono">/{b.slug}</p>
              <div className="flex gap-1 mt-3 justify-end">
                <Button size="icon" variant="ghost" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  ),
});
