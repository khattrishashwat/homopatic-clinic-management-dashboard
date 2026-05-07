import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/clinic/DashboardLayout";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: () => {
    if (!localStorage.getItem("token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardLayout,
});
