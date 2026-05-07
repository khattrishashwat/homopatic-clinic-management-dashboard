import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Image, Download, Eye, Trash2, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/_dashboard/medical-records")({
  component: MedicalRecordsPage,
});

const mockRecords = [
  { id: "REC001", patientName: "Raj Sharma", type: "pdf", name: "Blood Test Report", date: "2026-04-20", category: "Lab Report" },
  { id: "REC002", patientName: "Priya Sharma", type: "image", name: "Ultrasound Scan", date: "2026-04-15", category: "Scan" },
  { id: "REC003", patientName: "Ananya Verma", type: "pdf", name: "MRI Report", date: "2026-03-28", category: "Scan" },
  { id: "REC004", patientName: "Vikram Singh", type: "pdf", name: "Allergy Test Results", date: "2026-04-10", category: "Lab Report" },
  { id: "REC005", patientName: "Sneha Gupta", type: "image", name: "X-Ray Knee Joint", date: "2026-05-01", category: "X-Ray" },
];

const categories = ["All", "Lab Report", "Scan", "X-Ray", "Prescription"];

function MedicalRecordsPage() {
  const [filter, setFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState<typeof mockRecords[0] | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const filtered = filter === "All" ? mockRecords : mockRecords.filter((r) => r.category === filter);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Medical Records</h1>
          <p className="text-sm text-muted-foreground">Upload and manage patient reports</p>
        </div>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Upload className="h-4 w-4 mr-1" /> Upload Record
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <Button key={c} size="sm" variant={filter === c ? "default" : "outline"} onClick={() => setFilter(c)}>{c}</Button>
        ))}
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((rec) => (
          <Card key={rec.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2.5 ${rec.type === "pdf" ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"}`}>
                  {rec.type === "pdf" ? <FileText className="h-5 w-5" /> : <Image className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{rec.name}</p>
                  <p className="text-xs text-muted-foreground">{rec.patientName} · {rec.date}</p>
                  <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] mt-1">{rec.category}</span>
                </div>
              </div>
              <div className="flex gap-1 mt-3 justify-end">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreview(rec)}><Eye className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Medical Record</DialogTitle>
            <DialogDescription>Drag and drop or click to upload</DialogDescription>
          </DialogHeader>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
            className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer
              ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, Images, Scans up to 10MB</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={() => setShowUpload(false)}>Upload</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>{preview?.patientName} · {preview?.date}</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted/50 p-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">File preview will be rendered here</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Download</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}