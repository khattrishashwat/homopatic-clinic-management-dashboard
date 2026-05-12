import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Download, Eye, FileText, FolderOpen, Image, Trash2, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { medicalRecordsApi, type MedicalRecordDto } from "@/services/adminApi";
import { formatDate } from "@/lib/format";
import { getAssetUrl } from "@/utils/httpsclient";

export const Route = createFileRoute("/_dashboard/medical-records")({
  component: MedicalRecordsPage,
});

function MedicalRecordsPage() {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState<MedicalRecordDto | null>(null);
  const recordsQuery = useQuery({ queryKey: ["medical-records"], queryFn: () => medicalRecordsApi.list({ limit: 50 }) });
  const records = recordsQuery.data?.data || [];
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => medicalRecordsApi.upload(formData),
    onSuccess: () => {
      toast.success("Record uploaded");
      setShowUpload(false);
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: medicalRecordsApi.delete,
    onSuccess: () => {
      toast.success("Record deleted");
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
    },
  });
  const handleUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    uploadMutation.mutate(new FormData(event.currentTarget));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold">Medical Records</h1><p className="text-sm text-muted-foreground">Upload and manage patient reports</p></div>
        <Button size="sm" onClick={() => setShowUpload(true)}><Upload className="mr-1 h-4 w-4" /> Upload Record</Button>
      </div>
      {recordsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading records...</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => (
          <Card key={record._id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2.5 ${record.file_type?.includes("pdf") ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"}`}>
                  {record.file_type?.includes("pdf") ? <FileText className="h-5 w-5" /> : <Image className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{record.title}</p>
                  <p className="text-xs text-muted-foreground">{record.patient?.name || "Patient"} · {formatDate(record.record_date || record.created_at)}</p>
                  <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px]">{record.file_type || "file"}</span>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreview(record)}><Eye className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" asChild><a href={getAssetUrl(record.file_url)} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /></a></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(record._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!recordsQuery.isLoading && records.length === 0 && <p className="text-sm text-muted-foreground">No records found</p>}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Medical Record</DialogTitle><DialogDescription>Attach a PDF or image report</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handleUpload}>
            <Input name="patientId" required placeholder="Patient ID" />
            <Input name="title" required placeholder="Record title" />
            <Input name="record" required type="file" accept="image/png,image/jpeg,application/pdf" />
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button><Button type="submit" disabled={uploadMutation.isPending}>{uploadMutation.isPending ? "Uploading..." : "Upload"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{preview?.title}</DialogTitle><DialogDescription>{preview?.patient?.name || "Patient"} · {formatDate(preview?.record_date)}</DialogDescription></DialogHeader>
          <div className="rounded-xl bg-muted/50 p-12 text-center"><FolderOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground" /><p className="text-sm text-muted-foreground">{preview?.description || "Open the file to preview/download."}</p></div>
          {preview && <div className="flex justify-end"><Button size="sm" asChild><a href={getAssetUrl(preview.file_url)} target="_blank" rel="noreferrer"><Download className="mr-1 h-3.5 w-3.5" /> Download</a></Button></div>}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
