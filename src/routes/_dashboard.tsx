import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/clinic/DashboardLayout";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async () => {
    // Check token only on client-side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: DashboardLayout,
});
