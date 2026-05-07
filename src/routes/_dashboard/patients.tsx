import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Eye, Edit, Trash2, Users, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { mockPatients, type Patient } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_dashboard/patients")({
  component: PatientsPage,
});

function PatientsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = mockPatients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.conditions.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  // Group family members
  const familyGroups = mockPatients.reduce((acc, p) => {
    if (p.familyGroupId) {
      if (!acc[p.familyGroupId]) acc[p.familyGroupId] = { name: p.familyName || "", members: [] };
      acc[p.familyGroupId].members.push(p);
    }
    return acc;
  }, {} as Record<string, { name: string; members: Patient[] }>);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Patient Management</h1>
          <p className="text-sm text-muted-foreground">{mockPatients.length} registered patients</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Add Patient
        </Button>
      </div>

      {/* Family Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(familyGroups).map(([id, group]) => (
          <Card key={id} className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{group.name}</h3>
              </div>
              <div className="space-y-2">
                {group.members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedPatient(m)}
                    className="flex w-full items-center justify-between rounded-lg bg-card p-2.5 text-sm hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <p className="font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.age}y · {m.gender}</p>
                    </div>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, ID, or condition..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Patients Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Age/Gender</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Conditions</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Visits</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Visit</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.age}y · {p.gender}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.conditions.map((c) => (
                          <span key={c} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.totalVisits}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.lastVisit}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedPatient(p)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Patient Profile Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Profile — {selectedPatient?.name}</DialogTitle>
            <DialogDescription>ID: {selectedPatient?.id}</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <Tabs defaultValue="info">
              <TabsList className="w-full">
                <TabsTrigger value="info">Basic Info</TabsTrigger>
                <TabsTrigger value="history">Medical History</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Full Name</p><p className="font-medium">{selectedPatient.name}</p></div>
                  <div><p className="text-muted-foreground">Age / Gender</p><p className="font-medium">{selectedPatient.age} / {selectedPatient.gender}</p></div>
                  <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selectedPatient.phone}</p></div>
                  <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedPatient.email}</p></div>
                  <div><p className="text-muted-foreground">Address</p><p className="font-medium">{selectedPatient.address}</p></div>
                  <div><p className="text-muted-foreground">Registered</p><p className="font-medium">{selectedPatient.registeredDate}</p></div>
                  <div><p className="text-muted-foreground">Total Visits</p><p className="font-medium">{selectedPatient.totalVisits}</p></div>
                  <div><p className="text-muted-foreground">Last Visit</p><p className="font-medium">{selectedPatient.lastVisit}</p></div>
                </div>
                {selectedPatient.familyName && (
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Family Group</p>
                    <p className="text-sm font-medium text-primary">{selectedPatient.familyName}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Conditions</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPatient.conditions.map((c) => (
                      <span key={c} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{c}</span>
                    ))}
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                    Detailed medical history records will be shown here when connected to the backend.
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="appointments" className="mt-4">
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  Appointment history will be loaded from the patient's records.
                </div>
              </TabsContent>
              <TabsContent value="payments" className="mt-4">
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  Payment history will be loaded from billing records.
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Enter patient details to register</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddForm(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Full Name</label><Input placeholder="Patient name" /></div>
              <div><label className="text-sm font-medium">Age</label><Input type="number" placeholder="Age" /></div>
              <div><label className="text-sm font-medium">Phone</label><Input placeholder="+91 XXXXX XXXXX" /></div>
              <div><label className="text-sm font-medium">Email</label><Input placeholder="email@example.com" /></div>
            </div>
            <div><label className="text-sm font-medium">Address</label><Input placeholder="Full address" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit">Register Patient</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}