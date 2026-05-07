import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Eye, Printer, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockPrescriptions, type Prescription } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_dashboard/prescriptions")({
  component: PrescriptionsPage,
});

function PrescriptionsPage() {
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", duration: "" }]);

  const addMedicine = () => setMedicines([...medicines, { name: "", dosage: "", duration: "" }]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <p className="text-sm text-muted-foreground">Create and manage patient prescriptions</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Prescription
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPrescriptions.map((rx) => (
          <Card key={rx.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedRx(rx)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{rx.patientName}</p>
                  <p className="text-xs text-muted-foreground">{rx.id} · {rx.date}</p>
                </div>
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                {rx.medicines.map((m, i) => (
                  <div key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                    <p className="font-medium text-foreground">{m.name}</p>
                    <p className="text-muted-foreground">{m.dosage} · {m.duration}</p>
                  </div>
                ))}
              </div>
              {rx.followUp && (
                <p className="mt-3 text-xs text-primary font-medium">Follow-up: {rx.followUp}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prescription Detail */}
      <Dialog open={!!selectedRx} onOpenChange={() => setSelectedRx(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prescription Preview</DialogTitle>
            <DialogDescription>{selectedRx?.id} — {selectedRx?.patientName}</DialogDescription>
          </DialogHeader>
          {selectedRx && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 space-y-3">
                <div className="text-center border-b pb-3">
                  <h3 className="font-bold text-primary">HomeoClinic</h3>
                  <p className="text-xs text-muted-foreground">Homeopathy & Wellness Center</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selectedRx.patientName}</span></div>
                  <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{selectedRx.date}</span></div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">MEDICINES</p>
                  {selectedRx.medicines.map((m, i) => (
                    <div key={i} className="flex justify-between py-1.5 text-sm border-b last:border-0">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground">{m.dosage} · {m.duration}</span>
                    </div>
                  ))}
                </div>
                {selectedRx.notes && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">DOCTOR NOTES</p>
                    <p className="text-sm">{selectedRx.notes}</p>
                  </div>
                )}
                {selectedRx.followUp && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">FOLLOW-UP</p>
                    <p className="text-sm font-medium text-primary">{selectedRx.followUp}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline"><Printer className="h-3.5 w-3.5 mr-1" /> Print</Button>
                <Button size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Download PDF</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Prescription */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
            <DialogDescription>Create a new prescription for a patient</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowCreate(false); }}>
            <Input placeholder="Patient name or ID" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Medicines</p>
                <Button type="button" size="sm" variant="outline" onClick={addMedicine}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
              </div>
              {medicines.map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <Input placeholder="Medicine" />
                  <Input placeholder="Dosage" />
                  <Input placeholder="Duration" />
                </div>
              ))}
            </div>
            <Textarea placeholder="Doctor notes..." />
            <Input type="date" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit">Create Prescription</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}