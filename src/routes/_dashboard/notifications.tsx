import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Bell, CheckCircle, RefreshCw, X, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { notificationsApi } from "@/services/adminApi";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_dashboard/notifications")({
  component: NotificationsPage,
});

interface NotificationDto {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

function NotificationsPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationDto | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as NotificationDto["type"],
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list({ limit: 100 }),
  });
  const notifications = notificationsQuery.data?.data || [];

  // Create notification mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return notificationsApi.create(data);
    },
    onSuccess: () => {
      toast.success("Notification created successfully");
      setShowCreateDialog(false);
      setFormData({ title: "", message: "", type: "info" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create notification");
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return notificationsApi.markAsRead(id);
    },
    onSuccess: () => {
      toast.success("Notification marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to mark as read");
    },
  });

  // Manual send mutation (for bulk/manual sending)
  const manualSendMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return notificationsApi.sendManual(data);
    },
    onSuccess: () => {
      toast.success("Notification sent successfully");
      setShowCreateDialog(false);
      setFormData({ title: "", message: "", type: "info" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to send notification");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleManualSend = (e: React.FormEvent) => {
    e.preventDefault();
    manualSendMutation.mutate(formData);
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleRefresh = () => {
    setIsSending(true);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    setTimeout(() => {
      setIsSending(false);
      toast.success("Notifications refreshed");
    }, 500);
  };

  const handleViewDetails = (notification: NotificationDto) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage and send notifications</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isSending}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${isSending ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowCreateDialog(true)}
          >
            <Bell className="mr-1 h-4 w-4" />
            Create
          </Button>
          <Button 
            size="sm" 
            onClick={() => {
              setFormData({ title: "", message: "", type: "info" });
              setShowCreateDialog(true);
            }}
          >
            <Send className="mr-1 h-4 w-4" />
            Send Manual
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Notifications</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">
                  {notifications.filter((n) => !n.read).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Read</p>
                <p className="text-2xl font-bold">
                  {notifications.filter((n) => n.read).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Message</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notificationsQuery.isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading notifications...
                      </div>
                    </td>
                  </tr>
                )}
                {notifications.map((notification) => (
                  <tr 
                    key={notification._id} 
                    className={`border-b hover:bg-muted/30 transition-colors cursor-pointer ${!notification.read ? "bg-blue-50/30" : ""}`}
                    onClick={() => handleViewDetails(notification)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-xs">{notification.title}</div>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                      {notification.message}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${getNotificationTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={notification.read ? "read" : "pending"} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleMarkAsRead(notification._id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!notificationsQuery.isLoading && notifications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      No notifications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Manual Send Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Create and send a new notification to users
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualSend}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={manualSendMutation.isPending}
              >
                {manualSendMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{selectedNotification.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Message</Label>
                <p className="text-sm">{selectedNotification.message}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${getNotificationTypeColor(selectedNotification.type)}`}>
                    {selectedNotification.type}
                  </span>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p>
                  <StatusBadge status={selectedNotification.read ? "read" : "pending"} />
                </p>
              </div>
              {selectedNotification.readAt && (
                <div>
                  <Label className="text-muted-foreground">Read At</Label>
                  <p className="text-sm">{formatDate(selectedNotification.readAt)}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="text-sm">{formatDate(selectedNotification.createdAt)}</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setSelectedNotification(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}