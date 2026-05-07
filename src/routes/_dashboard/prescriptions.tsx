import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Download, FileText, Plus, Printer, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { prescriptionsApi, type PrescriptionDto } from "@/services/adminApi";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/prescriptions")({
  component: PrescriptionsPage,
});

function PrescriptionsPage() {
  const queryClient = useQueryClient();
  const [selectedRx, setSelectedRx] = useState<PrescriptionDto | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", duration: "" }]);
  const prescriptionsQuery = useQuery({ queryKey: ["prescriptions"], queryFn: () => prescriptionsApi.list({ limit: 50 }) });
  const prescriptions = prescriptionsQuery.data?.data || [];
  const createMutation = useMutation({
    mutationFn: (formData: FormData) =>
      prescriptionsApi.create({
        patientId: String(formData.get("patientId") || ""),
        title: String(formData.get("title") || "Prescription"),
        notes: String(formData.get("notes") || ""),
        medicines: medicines.filter((medicine) => medicine.name && medicine.dosage && medicine.duration),
      }),
    onSuccess: () => {
      toast.success("Prescription created");
      setShowCreate(false);
      setMedicines([{ name: "", dosage: "", duration: "" }]);
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: prescriptionsApi.delete,
    onSuccess: () => {
      toast.success("Prescription deleted");
      setSelectedRx(null);
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });
  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate(new FormData(event.currentTarget));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold">Prescriptions</h1><p className="text-sm text-muted-foreground">Create and manage patient prescriptions</p></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4" /> New Prescription</Button>
      </div>
      {prescriptionsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading prescriptions...</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prescriptions.map((rx) => (
          <Card key={rx._id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedRx(rx)}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div><p className="font-semibold text-foreground">{rx.patient?.name || "Patient"}</p><p className="text-xs text-muted-foreground">{rx._id.slice(-8)} · {formatDate(rx.created_at)}</p></div>
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                {rx.medicines.map((medicine, index) => <div key={`${medicine.name}-${index}`} className="rounded-lg bg-muted/50 px-3 py-2 text-xs"><p className="font-medium text-foreground">{medicine.name}</p><p className="text-muted-foreground">{medicine.dosage} · {medicine.duration}</p></div>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!prescriptionsQuery.isLoading && prescriptions.length === 0 && <p className="text-sm text-muted-foreground">No prescriptions found</p>}

      <Dialog open={!!selectedRx} onOpenChange={() => setSelectedRx(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Prescription Preview</DialogTitle><DialogDescription>{selectedRx?._id.slice(-8)} - {selectedRx?.patient?.name || "Patient"}</DialogDescription></DialogHeader>
          {selectedRx && <div className="space-y-4">
            <div className="space-y-3 rounded-xl border p-4">
              <div className="border-b pb-3 text-center"><h3 className="font-bold text-primary">HomeoClinic</h3><p className="text-xs text-muted-foreground">Homeopathy & Wellness Center</p></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selectedRx.patient?.name || "-"}</span></div><div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{formatDate(selectedRx.created_at)}</span></div></div>
              <div className="border-t pt-3"><p className="mb-2 text-xs font-medium text-muted-foreground">MEDICINES</p>{selectedRx.medicines.map((medicine, index) => <div key={index} className="flex justify-between border-b py-1.5 text-sm last:border-0"><span className="font-medium">{medicine.name}</span><span className="text-muted-foreground">{medicine.dosage} · {medicine.duration}</span></div>)}</div>
              {selectedRx.notes && <div className="border-t pt-3"><p className="mb-1 text-xs font-medium text-muted-foreground">DOCTOR NOTES</p><p className="text-sm">{selectedRx.notes}</p></div>}
            </div>
            <div className="flex justify-end gap-2"><Button size="sm" variant="outline"><Printer className="mr-1 h-3.5 w-3.5" /> Print</Button><Button size="sm"><Download className="mr-1 h-3.5 w-3.5" /> Download PDF</Button><Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(selectedRx._id)}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete</Button></div>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Prescription</DialogTitle><DialogDescription>Create a new prescription for a patient</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handleCreate}>
            <Input name="patientId" required placeholder="Patient ID" />
            <Input name="title" placeholder="Title" defaultValue="Prescription" />
            <div className="space-y-3">
              <div className="flex items-center justify-between"><p className="text-sm font-medium">Medicines</p><Button type="button" size="sm" variant="outline" onClick={() => setMedicines([...medicines, { name: "", dosage: "", duration: "" }])}><Plus className="mr-1 h-3.5 w-3.5" /> Add</Button></div>
              {medicines.map((medicine, index) => <div key={index} className="grid grid-cols-3 gap-2"><Input placeholder="Medicine" value={medicine.name} onChange={(event) => setMedicines((prev) => prev.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /><Input placeholder="Dosage" value={medicine.dosage} onChange={(event) => setMedicines((prev) => prev.map((item, i) => i === index ? { ...item, dosage: event.target.value } : item))} /><Input placeholder="Duration" value={medicine.duration} onChange={(event) => setMedicines((prev) => prev.map((item, i) => i === index ? { ...item, duration: event.target.value } : item))} /></div>)}
            </div>
            <Textarea name="notes" placeholder="Doctor notes..." />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={createMutation.isPending}>Create Prescription</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
