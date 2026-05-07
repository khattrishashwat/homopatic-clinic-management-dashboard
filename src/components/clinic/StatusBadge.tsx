import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "error" | "info" | "default" | "muted";

const variantClasses: Record<StatusVariant, string> = {
  success: "bg-success/15 text-success border-success/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/20",
  error: "bg-destructive/15 text-destructive border-destructive/20",
  info: "bg-info/15 text-info border-info/20",
  default: "bg-primary/10 text-primary border-primary/20",
  muted: "bg-muted text-muted-foreground border-border",
};

const getVariant = (status: string): StatusVariant => {
  const map: Record<string, StatusVariant> = {
    approved: "success", confirmed: "success", completed: "success", delivered: "success", sent: "success", paid: "success", captured: "success", available: "success", read: "success",
    pending: "warning", packed: "warning", processing: "warning", rescheduled: "warning", created: "warning", blocked: "warning",
    missed: "error", rejected: "error", failed: "error", cancelled: "error",
    refunded: "info", draft: "muted", published: "success",
    online: "info", offline: "default", shipped: "info", upi: "info", card: "info", wallet: "info", netbanking: "info",
  };
  return map[status] || "default";
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant = getVariant(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        variantClasses[variant],
        className
      )}
    >
      {status}
    </span>
  );
}
