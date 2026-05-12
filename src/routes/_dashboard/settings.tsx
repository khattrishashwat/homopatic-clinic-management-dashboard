import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { settingsApi } from "@/services/adminApi";

export const Route = createFileRoute("/_dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const [appointmentQuery, paymentQuery, notificationQuery] = useQueries({
    queries: [
      { queryKey: ["settings", "appointment"], queryFn: settingsApi.getAppointment },
      { queryKey: ["settings", "payment"], queryFn: settingsApi.getPayment },
      { queryKey: ["settings", "notification"], queryFn: settingsApi.getNotification },
    ],
  });
  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await settingsApi.updateAppointment({
        slot_duration: Number(formData.get("slot_duration") || 30),
        advance_booking_days: Number(formData.get("advance_booking_days") || 30),
        enable_online_booking: formData.get("enable_online_booking") === "on",
      });
      await settingsApi.updatePayment({
        razorpay_key_id: String(formData.get("razorpay_key_id") || ""),
        enable_payments: formData.get("enable_payments") === "on",
        enable_appointment_payment: formData.get("enable_appointment_payment") === "on",
      });
      await settingsApi.updateNotification({
        enable_whatsapp: formData.get("enable_whatsapp") === "on",
        enable_sms: formData.get("enable_sms") === "on",
        enable_email: formData.get("enable_email") === "on",
      });
    },
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(new FormData(event.currentTarget));
  };
  const appointment = appointmentQuery.data || {};
  const payment = paymentQuery.data || {};
  const notification = notificationQuery.data || {};

  return (
    <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-6" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Appointment Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Slot Duration</Label><Input name="slot_duration" type="number" defaultValue={String(appointment.slot_duration || 30)} /></div>
            <div><Label>Advance Booking Days</Label><Input name="advance_booking_days" type="number" defaultValue={String(appointment.advance_booking_days || 30)} /></div>
          </div>
          <SwitchField id="enable_online_booking" label="Enable Online Booking" defaultChecked={Boolean(appointment.enable_online_booking ?? true)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SwitchField id="enable_whatsapp" label="Enable WhatsApp" defaultChecked={Boolean(notification.enable_whatsapp ?? true)} />
          <SwitchField id="enable_sms" label="Enable SMS" defaultChecked={Boolean(notification.enable_sms ?? true)} />
          <SwitchField id="enable_email" label="Enable Email" defaultChecked={Boolean(notification.enable_email ?? true)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Payment Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Razorpay Key ID</Label><Input name="razorpay_key_id" placeholder="rzp_live_xxxxx" type="password" /></div>
          <SwitchField id="enable_payments" label="Enable Online Payments" defaultChecked={Boolean(payment.enable_payments)} />
          <SwitchField id="enable_appointment_payment" label="Enable Appointment Payment" defaultChecked={Boolean(payment.enable_appointment_payment)} />
        </CardContent>
      </Card>
      <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Save Settings"}</Button>
    </motion.form>
  );
}

function SwitchField({ id, label, defaultChecked }: { id: string; label: string; defaultChecked: boolean }) {
  return <div className="flex items-center gap-3"><Switch id={id} name={id} defaultChecked={defaultChecked} /><Label htmlFor={id}>{label}</Label></div>;
}
