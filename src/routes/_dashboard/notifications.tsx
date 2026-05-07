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
