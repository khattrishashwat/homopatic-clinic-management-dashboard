import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Edit, Package, Plus, Star, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { productsApi, type ProductDto } from "@/services/adminApi";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [showForm, setShowForm] = useState(false);
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list({ limit: 50 }) });
  const products = productsQuery.data?.data || [];
  const saveMutation = useMutation({
    mutationFn: (formData: FormData) => {
      const payload = {
        name: String(formData.get("name") || ""),
        category: String(formData.get("category") || ""),
        price: Number(formData.get("price") || 0),
        compare_price: Number(formData.get("compare_price") || 0) || undefined,
        stock: Number(formData.get("stock") || 0),
      };
      return editing ? productsApi.update(editing._id, payload) : productsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      setShowForm(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(new FormData(event.currentTarget));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Products</h1><p className="text-sm text-muted-foreground">Manage clinic products and packages</p></div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="mr-1 h-4 w-4" /> Add Product</Button>
      </div>
      {productsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading products...</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product._id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="rounded-xl bg-primary/10 p-2.5"><Package className="h-5 w-5 text-primary" /></div>
                {product.in_stock && <Star className="h-4 w-4 fill-warning text-warning-foreground" />}
              </div>
              <h3 className="font-semibold text-foreground">{product.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{product.category || "Uncategorized"} · Stock: {product.stock || 0}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-primary">{formatCurrency(product.price)}</span>
                {product.compare_price ? <span className="text-sm text-muted-foreground line-through">{formatCurrency(product.compare_price)}</span> : null}
              </div>
              <div className="mt-3 flex justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(product); setShowForm(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(product._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>Save product details</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input name="name" required placeholder="Product name" defaultValue={editing?.name} />
            <Input name="category" placeholder="Category" defaultValue={editing?.category} />
            <div className="grid grid-cols-3 gap-2">
              <Input name="price" required type="number" placeholder="Price" defaultValue={editing?.price} />
              <Input name="compare_price" type="number" placeholder="MRP" defaultValue={editing?.compare_price} />
              <Input name="stock" type="number" placeholder="Stock" defaultValue={editing?.stock} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
