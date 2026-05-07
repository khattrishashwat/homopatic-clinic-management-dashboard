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
          <div><Label>Default Consultation Fee</Label><Input type="number" defaultValue="800" /></div>
          <div className="flex items-center gap-3"><Switch id="online-pay" defaultChecked /><Label htmlFor="online-pay">Enable Online Payments</Label></div>
        </CardContent>
      </Card>
      <Button>Save Settings</Button>
    </motion.div>
  ),
});
