import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { notificationsApi } from "@/services/adminApi";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const notificationsQuery = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsApi.list({ limit: 50 }) });
  const notifications = notificationsQuery.data?.data || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-sm text-muted-foreground">Notification logs</p></div>
        <Button size="sm" disabled><Send className="mr-1 h-4 w-4" /> Send Manual</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">{["Title", "Message", "Status", "Date"].map((heading) => <th key={heading} className="px-4 py-3 text-left font-medium text-muted-foreground">{heading}</th>)}</tr></thead>
              <tbody>
                {notificationsQuery.isLoading && <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">Loading notifications...</td></tr>}
                {notifications.map((notification) => (
                  <tr key={notification._id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs font-medium">{notification.title}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{notification.message}</td>
                    <td className="px-4 py-3"><StatusBadge status={notification.read ? "read" : "pending"} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(notification.createdAt)}</td>
                  </tr>
                ))}
                {!notificationsQuery.isLoading && notifications.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No notifications found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
