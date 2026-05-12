import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, Search, Trash2, UserPlus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { patientsApi, type PatientDto } from "@/services/adminApi";
import { formatDate, getAddressText, getAge } from "@/lib/format";

export const Route = createFileRoute("/_dashboard/patients")({
  component: PatientsPage,
});

function PatientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const patientsQuery = useQuery({ queryKey: ["patients", search], queryFn: () => patientsApi.list({ search, limit: 50 }) });
  const patients = patientsQuery.data?.data || [];
  const familyGroups = patients.reduce<Record<string, PatientDto[]>>((acc, patient) => {
    if (patient.family_group) acc[patient.family_group] = [...(acc[patient.family_group] || []), patient];
    return acc;
  }, {});

  const createMutation = useMutation({
    mutationFn: (formData: FormData) =>
      patientsApi.create({
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        gender: String(formData.get("gender") || "other") as PatientDto["gender"],
        dob: String(formData.get("dob") || ""),
        address: { street: String(formData.get("address") || "") },
      }),
    onSuccess: () => {
      toast.success("Patient registered");
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: patientsApi.delete,
    onSuccess: () => {
      toast.success("Patient removed");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate(new FormData(event.currentTarget));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Management</h1>
          <p className="text-sm text-muted-foreground">{patientsQuery.data?.pagination?.total || patients.length} registered patients</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <UserPlus className="mr-1 h-4 w-4" /> Add Patient
        </Button>
      </div>

      {Object.keys(familyGroups).length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(familyGroups).map(([group, members]) => (
            <Card key={group} className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{group}</h3>
                </div>
                <div className="space-y-2">
                  {members.map((member) => (
                    <button key={member._id} onClick={() => setSelectedPatient(member)} className="flex w-full items-center justify-between rounded-lg bg-card p-2.5 text-sm transition-shadow hover:shadow-sm">
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{getAge(member.dob)}y · {member.gender || "-"}</p>
                      </div>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, ID, email, or phone..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {["ID", "Name", "Age/Gender", "Phone", "Conditions", "Registered", "Actions"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left font-medium text-muted-foreground">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patientsQuery.isLoading && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Loading patients...</td></tr>}
                {patients.map((patient) => (
                  <tr key={patient._id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{patient.patientId}</td>
                    <td className="px-4 py-3 font-medium">{patient.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getAge(patient.dob)}y · {patient.gender || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{patient.phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(patient.medical_history || []).slice(0, 3).map((condition) => (
                          <span key={condition} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{condition}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(patient.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedPatient(patient)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(patient._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!patientsQuery.isLoading && patients.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No patients found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Profile - {selectedPatient?.name}</DialogTitle>
            <DialogDescription>ID: {selectedPatient?.patientId}</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <Tabs defaultValue="info">
              <TabsList className="w-full">
                <TabsTrigger value="info">Basic Info</TabsTrigger>
                <TabsTrigger value="history">Medical History</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Full Name</p><p className="font-medium">{selectedPatient.name}</p></div>
                <div><p className="text-muted-foreground">Age / Gender</p><p className="font-medium">{getAge(selectedPatient.dob)} / {selectedPatient.gender || "-"}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selectedPatient.phone}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedPatient.email}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">Address</p><p className="font-medium">{getAddressText(selectedPatient.address)}</p></div>
                <div><p className="text-muted-foreground">Registered</p><p className="font-medium">{formatDate(selectedPatient.created_at)}</p></div>
                <div><p className="text-muted-foreground">Family Group</p><p className="font-medium">{selectedPatient.family_group || "-"}</p></div>
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {(selectedPatient.medical_history || []).map((condition) => (
                    <span key={condition} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{condition}</span>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Enter patient details to register</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Full Name</label><Input name="name" required placeholder="Patient name" /></div>
              <div><label className="text-sm font-medium">Date of Birth</label><Input name="dob" type="date" /></div>
              <div><label className="text-sm font-medium">Gender</label><Input name="gender" placeholder="male/female/other" /></div>
              <div><label className="text-sm font-medium">Phone</label><Input name="phone" required placeholder="+91 XXXXX XXXXX" /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Email</label><Input name="email" required type="email" placeholder="email@example.com" /></div>
            </div>
            <div><label className="text-sm font-medium">Address</label><Input name="address" placeholder="Full address" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Saving..." : "Register Patient"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
