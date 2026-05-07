import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/clinic/DashboardLayout";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});