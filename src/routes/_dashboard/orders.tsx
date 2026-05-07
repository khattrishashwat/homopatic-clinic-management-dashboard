import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { mockOrders } from "@/lib/mock-data";

export const Route = createFileRoute("/_dashboard/orders")({
  component: () => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="border-b bg-muted/50">
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Products</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
        </tr></thead><tbody>
          {mockOrders.map((o) => (
            <tr key={o.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
              <td className="px-4 py-3 font-medium">{o.customerName}</td>
              <td className="px-4 py-3 text-muted-foreground">{o.products.join(", ")}</td>
              <td className="px-4 py-3 font-semibold">₹{o.total}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
            </tr>
          ))}
        </tbody></table>
      </div></CardContent></Card>
    </motion.div>
  ),
});
*** Add File: src/routes/_dashboard/notifications.tsx
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { mockNotifications } from "@/lib/mock-data";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_dashboard/notifications")({
  component: () => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-sm text-muted-foreground">WhatsApp notification logs</p></div>
        <Button size="sm"><Send className="h-4 w-4 mr-1" /> Send Manual</Button>
      </div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="border-b bg-muted/50">
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Message</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recipient</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Channel</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
        </tr></thead><tbody>
          {mockNotifications.map((n) => (
            <tr key={n.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 capitalize text-xs font-medium">{n.type}</td>
              <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{n.message}</td>
              <td className="px-4 py-3 font-mono text-xs">{n.recipient}</td>
              <td className="px-4 py-3"><StatusBadge status={n.channel} /></td>
              <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{n.date}</td>
            </tr>
          ))}
        </tbody></table>
      </div></CardContent></Card>
    </motion.div>
  ),
});
*** Add File: src/routes/_dashboard/blogs.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Globe, FileText } from "lucide-react";
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
*** Add File: src/routes/_dashboard/settings.tsx
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_dashboard/settings")({
  component: () => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Clinic Timings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Opening Time</Label><Input type="time" defaultValue="10:00" /></div>
            <div><Label>Closing Time</Label><Input type="time" defaultValue="20:00" /></div>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="weekend-only" defaultChecked />
            <Label htmlFor="weekend-only">Weekend Slots Only (Sat & Sun)</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">WhatsApp Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>WhatsApp Business Number</Label><Input placeholder="+91 XXXXX XXXXX" defaultValue="+91 98765 00000" /></div>
          <div className="flex items-center gap-3"><Switch id="auto-remind" defaultChecked /><Label htmlFor="auto-remind">Auto Send Appointment Reminders</Label></div>
          <div className="flex items-center gap-3"><Switch id="booking-notify" defaultChecked /><Label htmlFor="booking-notify">Booking Confirmation Notifications</Label></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payment Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Razorpay Key ID</Label><Input placeholder="rzp_live_xxxxx" type="password" /></div>
          <div><Label>Default Consultation Fee (₹)</Label><Input type="number" defaultValue="800" /></div>
          <div className="flex items-center gap-3"><Switch id="online-pay" defaultChecked /><Label htmlFor="online-pay">Enable Online Payments</Label></div>
        </CardContent>
      </Card>

      <Button>Save Settings</Button>
    </motion.div>
  ),
});