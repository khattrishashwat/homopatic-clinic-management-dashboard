import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Star, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { mockProducts } from "@/lib/mock-data";

export const Route = createFileRoute("/_dashboard/products")({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Products</h1><p className="text-sm text-muted-foreground">Manage clinic products and packages</p></div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProducts.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="rounded-xl bg-primary/10 p-2.5"><Package className="h-5 w-5 text-primary" /></div>
                {p.featured && <Star className="h-4 w-4 text-warning-foreground fill-warning" />}
              </div>
              <h3 className="font-semibold text-foreground">{p.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{p.category} · Stock: {p.stock}</p>
              <div className="flex items-baseline gap-2 mt-2">
                {p.offerPrice ? (
                  <><span className="text-lg font-bold text-primary">₹{p.offerPrice}</span><span className="text-sm text-muted-foreground line-through">₹{p.price}</span></>
                ) : (
                  <span className="text-lg font-bold">₹{p.price}</span>
                )}
              </div>
              <div className="flex gap-1 mt-3 justify-end">
                <Button size="icon" variant="ghost" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}