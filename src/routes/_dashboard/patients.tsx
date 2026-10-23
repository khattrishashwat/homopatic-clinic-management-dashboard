import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { Component, FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Mail,
  MapPin,
  PenTool,
  Phone,
  Plus,
  Printer,
  Search,
  Trash2,
  Upload,
  UploadCloud,
  User,
  UserPlus,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  patientsApi,
  medicalRecordsApi,
  prescriptionsApi,
  type PatientDto,
  type MedicalRecordDto,
  type PrescriptionDto,
} from "@/services/adminApi";
import { formatDate, getAddressText, getAge } from "@/lib/format";
import { getAssetUrl } from "@/utils/httpsclient";

interface FamilyMemberInput {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: "male" | "female" | "other";
  dob: string;
  relationship: string;
}

interface ParsedBulkRow {
  rowNum: number;
  name: string;
  phone: string;
  email: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  family_group?: string;
  relationship?: string;
  medical_history?: string;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): ParsedBulkRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const rows: ParsedBulkRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx]?.trim() || "";
    });

    const name = rowObj["name"] || rowObj["full name"] || "";
    const phone = rowObj["phone"] || rowObj["phone number"] || rowObj["mobile"] || "";
    const email = rowObj["email"] || rowObj["email address"] || "";
    const dob = rowObj["dob"] || rowObj["date of birth"] || "";
    const rawGender = (rowObj["gender"] || "other").toLowerCase();
    const gender: "male" | "female" | "other" = ["male", "female", "other"].includes(rawGender)
      ? (rawGender as "male" | "female" | "other")
      : "other";
    const street = rowObj["street"] || rowObj["address"] || "";
    const city = rowObj["city"] || "";
    const state = rowObj["state"] || "";
    const postal_code = rowObj["postal_code"] || rowObj["pincode"] || rowObj["zip"] || "";
    const family_group = rowObj["family_group"] || rowObj["family group"] || "";
    const relationship = rowObj["relationship"] || "";
    const medical_history = rowObj["medical_history"] || rowObj["conditions"] || "";
    const notes = rowObj["notes"] || "";

    const errors: string[] = [];
    if (!name) errors.push("Name is required");
    if (!phone) errors.push("Phone is required");
    if (!email) errors.push("Email is required");
    else if (!email.includes("@")) errors.push("Invalid email format");

    if (email && seenEmails.has(email.toLowerCase())) {
      errors.push("Duplicate email in file");
    } else if (email) {
      seenEmails.add(email.toLowerCase());
    }

    if (phone && seenPhones.has(phone)) {
      errors.push("Duplicate phone in file");
    } else if (phone) {
      seenPhones.add(phone);
    }

    rows.push({
      rowNum: i + 1,
      name,
      phone,
      email,
      dob,
      gender,
      street,
      city,
      state,
      postal_code,
      family_group,
      relationship,
      medical_history,
      notes,
      isValid: errors.length === 0,
      errors,
    });
  }

  return rows;
}

function downloadSampleTemplate() {
  const csvContent =
    "name,phone,email,dob,gender,street,city,state,postal_code,family_group,relationship,medical_history,notes\n" +
    "Amit Verma,9811122233,amit.v@gmail.com,1988-06-20,male,45 MG Road,Delhi,Delhi,110001,,,Sinusitis,Individual patient\n" +
    "Sneha Patel,9822233344,sneha.p@gmail.com,1995-11-12,female,102 SG Highway,Ahmedabad,Gujarat,380015,,,Thyroid,Individual patient\n" +
    "Rajesh Sharma,9833344455,rajesh.s@gmail.com,1980-03-15,male,Plot 14 Vaishali,Jaipur,Rajasthan,302021,FAM-SHARMA,Head,Hypertension,Family primary head\n" +
    "Sunita Sharma,9833344456,sunita.s@gmail.com,1984-08-22,female,Plot 14 Vaishali,Jaipur,Rajasthan,302021,FAM-SHARMA,Spouse,Migraine,Family member\n" +
    "Aarav Sharma,9833344455,aarav.s@gmail.com,2012-10-05,male,Plot 14 Vaishali,Jaipur,Rajasthan,302021,FAM-SHARMA,Child,Asthma,Minor child\n";

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "patient_bulk_sample_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ========================================================================= */
/* ERROR BOUNDARY FOR PATIENT DETAIL VIEW                                    */
/* ========================================================================= */
class DetailErrorBoundary extends React.Component<
  { children: React.ReactNode; onBack: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("PatientDetailPage error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 text-center space-y-4 my-6">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="text-lg font-bold text-foreground">Could not display patient details</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {this.state.error?.message || "An unexpected error occurred while loading this patient profile."}
          </p>
          <div className="pt-2">
            <Button variant="default" onClick={this.props.onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients List
            </Button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}

/* ========================================================================= */
/* DEDICATED PATIENT PROFILE & MEDICAL REPORTS PAGE (NO MODAL)               */
/* ========================================================================= */
function PatientDetailPage({
  patient,
  onBack,
}: {
  patient: PatientDto;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"reports" | "info" | "prescriptions">("reports");

  // Bulk Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ file: File; url: string; isImage: boolean }[]>([]);
  const [batchTitle, setBatchTitle] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]);
  const [batchNotes, setBatchNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lightbox Preview State
  const [lightboxRecord, setLightboxRecord] = useState<MedicalRecordDto | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [reportSearch, setReportSearch] = useState("");

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
        } catch {}
      });
    };
  }, [filePreviews]);

  // Queries
  const recordsQuery = useQuery({
    queryKey: ["patient-medical-records", patient?._id],
    queryFn: () => medicalRecordsApi.list({ patientId: patient?._id, limit: 100 }),
    enabled: Boolean(patient?._id),
  });
  const recordsData = recordsQuery.data;
  const records: MedicalRecordDto[] = Array.isArray(recordsData?.data)
    ? recordsData.data
    : Array.isArray(recordsData)
    ? recordsData
    : [];

  const prescriptionsQuery = useQuery({
    queryKey: ["patient-prescriptions", patient?.patientId || patient?._id],
    queryFn: () => prescriptionsApi.list({ search: patient?.patientId || patient?.name, limit: 50 }),
    enabled: Boolean(patient?.patientId || patient?._id),
  });
  const prescriptionsData = prescriptionsQuery.data;
  const prescriptions: PrescriptionDto[] = Array.isArray(prescriptionsData?.data)
    ? prescriptionsData.data
    : Array.isArray(prescriptionsData)
    ? prescriptionsData
    : [];

  // Safely parse medical history as an array regardless of whether it's stored as array, string, or comma-separated string
  const medicalHistoryList: string[] = Array.isArray(patient?.medical_history)
    ? patient.medical_history
    : typeof patient?.medical_history === "string" && (patient.medical_history as string).trim()
    ? (patient.medical_history as string).split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Mutations
  const uploadBulkMutation = useMutation({
    mutationFn: (formData: FormData) => medicalRecordsApi.uploadBulk(formData),
    onSuccess: (res: any) => {
      toast.success(res?.message || `${selectedFiles.length} medical report(s) uploaded successfully!`);
      clearFiles();
      setBatchTitle("");
      setBatchNotes("");
      queryClient.invalidateQueries({ queryKey: ["patient-medical-records", patient?._id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to upload medical reports");
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: (id: string) => medicalRecordsApi.delete(id),
    onSuccess: () => {
      toast.success("Medical report removed");
      if (lightboxRecord) setLightboxRecord(null);
      queryClient.invalidateQueries({ queryKey: ["patient-medical-records", patient?._id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete report");
    },
  });

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      isImage: f.type.startsWith("image/"),
    }));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      if (prev[index]) {
        try {
          URL.revokeObjectURL(prev[index].url);
        } catch {}
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearFiles = () => {
    filePreviews.forEach((p) => {
      try {
        URL.revokeObjectURL(p.url);
      } catch {}
    });
    setSelectedFiles([]);
    setFilePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image or report file");
      return;
    }
    if (!patient?._id) {
      toast.error("Patient ID is missing");
      return;
    }

    const formData = new FormData();
    formData.append("patientId", patient._id);
    if (batchTitle.trim()) formData.append("title", batchTitle.trim());
    if (recordDate) formData.append("record_date", recordDate);
    if (batchNotes.trim()) formData.append("notes", batchNotes.trim());

    selectedFiles.forEach((file) => {
      formData.append("records", file);
    });

    uploadBulkMutation.mutate(formData);
  };

  const filteredRecords = (records || []).filter((r) => {
    if (!reportSearch.trim()) return true;
    const q = reportSearch.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.file_type && r.file_type.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Top Bar with Back Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="hover:bg-muted font-medium">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Patients
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{patient?.name || "Patient Profile"}</h1>
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded">
                {patient?.patientId || "-"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {getAge(patient?.dob)} yrs · {patient?.gender || "Not specified"} · Registered on {formatDate(patient?.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/prescriptions" })}
            className="font-medium"
          >
            <PenTool className="mr-1.5 h-4 w-4 text-primary" /> Open Prescription Pad
          </Button>
        </div>
      </div>

      {/* Patient Summary Header Card */}
      <Card className="bg-muted/10 border-primary/20">
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Phone</p>
              <p className="font-semibold text-foreground">{patient?.phone || "-"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Email</p>
              <p className="font-semibold text-foreground truncate max-w-[150px]">{patient?.email || "-"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Address</p>
              <p className="font-semibold text-foreground truncate max-w-[180px]">{getAddressText(patient?.address)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Family Group</p>
              <p className="font-semibold text-foreground">{patient?.family_group || "Individual"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="reports" className="flex items-center gap-1.5 font-medium">
            <ImageIcon className="h-4 w-4" /> Medical Reports ({records.length})
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-1.5 font-medium">
            <User className="h-4 w-4" /> Patient Info
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-1.5 font-medium">
            <FileText className="h-4 w-4" /> Prescriptions ({prescriptions.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MEDICAL REPORTS & BULK IMAGE UPLOAD */}
        <TabsContent value="reports" className="mt-4 space-y-6">
          {/* BULK UPLOAD PANEL */}
          <Card className="border-2 border-primary/20 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <UploadCloud className="h-5 w-5 text-primary" /> Bulk Upload Medical Reports & Images
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload multiple images (.png, .jpg, .jpeg, .webp) and PDF reports at once for {patient?.name}
                  </p>
                </div>
                {selectedFiles.length > 0 && (
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    {selectedFiles.length} file(s) selected
                  </span>
                )}
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Drag & Drop Box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                  className={`rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/10"
                  }`}
                >
                  <UploadCloud className="mx-auto h-10 w-10 text-primary/70 mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    Drag and drop multiple report images or files here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Supports bulk PNG, JPG, JPEG, WEBP, and PDF files
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="hidden"
                    id="bulk-medical-file-input"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-medium"
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Select Files from Computer
                  </Button>
                </div>

                {/* Previews of Selected Files */}
                {filePreviews.length > 0 && (
                  <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>Selected Files ({filePreviews.length}):</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearFiles}
                        className="h-6 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Clear All
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                      {filePreviews.map((preview, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-lg border bg-background overflow-hidden group shadow-xs"
                        >
                          {preview.isImage ? (
                            <img
                              src={preview.url}
                              alt={preview.file.name}
                              className="h-24 w-full object-cover"
                            />
                          ) : (
                            <div className="h-24 w-full flex flex-col items-center justify-center bg-destructive/5 text-destructive p-2">
                              <FileText className="h-8 w-8 mb-1" />
                              <span className="text-[10px] font-mono uppercase">PDF</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-destructive transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>

                          <div className="p-1.5 bg-background border-t">
                            <p className="text-[11px] font-medium truncate" title={preview.file.name}>
                              {preview.file.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {(preview.file.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Batch Information Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Report Title / Category (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Blood Test, Ultrasound, X-Ray"
                      value={batchTitle}
                      onChange={(e) => setBatchTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Report Date
                    </label>
                    <Input
                      type="date"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      Clinical Notes / Remarks (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Fasting report, High eosinophils"
                      value={batchNotes}
                      onChange={(e) => setBatchNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={uploadBulkMutation.isPending || selectedFiles.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <UploadCloud className="mr-1.5 h-4 w-4" />
                    {uploadBulkMutation.isPending
                      ? `Uploading ${selectedFiles.length} File(s)...`
                      : `Upload All (${selectedFiles.length}) Medical Reports`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </TabsContent>

        {/* TAB 2: PATIENT INFO & CONDITIONS */}
        <TabsContent value="info" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Personal & Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Full Name</span>
                    <span className="font-semibold text-foreground">{patient?.name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Patient UID</span>
                    <span className="font-mono font-semibold text-primary">{patient?.patientId || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Date of Birth / Age</span>
                    <span className="font-semibold text-foreground">
                      {patient?.dob ? formatDate(patient.dob) : "N/A"} ({getAge(patient?.dob)} years)
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Gender</span>
                    <span className="font-semibold text-foreground capitalize">{patient?.gender || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Phone Number</span>
                    <span className="font-semibold text-foreground">{patient?.phone || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Email Address</span>
                    <span className="font-semibold text-foreground">{patient?.email || "-"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Residential Address</span>
                    <span className="font-semibold text-foreground">{getAddressText(patient?.address)}</span>
                  </div>
                </div>
              </div>



              {patient?.family_group && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Family Group</h3>
                  <div className="rounded-lg bg-muted/30 p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{patient.family_group}</p>
                      <p className="text-muted-foreground">Relationship: {patient.relationship || "Member"}</p>
                    </div>
                    <span className="bg-primary/10 text-primary font-medium px-2 py-0.5 rounded">
                      Family Account
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PRESCRIPTIONS */}
        <TabsContent value="prescriptions" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Prescription History ({prescriptions.length})</h3>
            <Button
              size="sm"
              onClick={() => navigate({ to: "/prescriptions" })}
            >
              <PenTool className="mr-1.5 h-4 w-4" /> Write New Prescription
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescriptions.map((rx) => {
              const rxNumber = rx.prescriptionNumber || `RX-${rx._id.slice(-6).toUpperCase()}`;

              return (
                <Card key={rx._id} className="overflow-hidden border transition-all hover:shadow-md">
                  {(rx.image_url || rx.image_s3_key) ? (
                    <div className="h-40 bg-muted/40 overflow-hidden border-b flex items-center justify-center">
                      <img
                        src={getAssetUrl(rx.image_url || rx.image_s3_key)}
                        alt="Prescription"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    <div className="h-28 bg-muted/20 flex items-center justify-center border-b">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}

                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {rxNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(rx.prescription_date || rx.created_at)}
                      </span>
                    </div>

                    {(rx.image_url || rx.image_s3_key) && (
                      <div className="flex items-center justify-end gap-1 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => window.open(getAssetUrl(rx.image_url || rx.image_s3_key), "_blank")}
                        >
                          <Eye className="mr-1 h-3 w-3" /> View Pad
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          asChild
                        >
                          <a href={getAssetUrl(rx.image_url || rx.image_s3_key)} target="_blank" rel="noreferrer" download={`Prescription_${rxNumber}.jpg`}>
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!prescriptionsQuery.isLoading && prescriptions.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground border-dashed">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="font-medium text-sm">No prescriptions written for this patient yet</p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => navigate({ to: "/prescriptions" })}
              >
                <PenTool className="mr-1.5 h-4 w-4" /> Open Pad & Prescribe
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* FULL-SCREEN LIGHTBOX DIALOG FOR MEDICAL REPORT IMAGES */}
      <Dialog open={!!lightboxRecord} onOpenChange={() => setLightboxRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>{lightboxRecord?.title || "Medical Report"}</span>
              <span className="text-xs font-mono font-normal text-muted-foreground">
                {formatDate(lightboxRecord?.record_date || lightboxRecord?.created_at)}
              </span>
            </DialogTitle>
            <DialogDescription>
              Patient: {patient?.name || "-"} ({patient?.patientId || "-"})
            </DialogDescription>
          </DialogHeader>

          {lightboxRecord && (
            <div className="space-y-4">
              <div className="overflow-auto max-h-[70vh] rounded-lg border bg-black/5 flex items-center justify-center p-2">
                <img
                  src={getAssetUrl(lightboxRecord.file_url)}
                  alt={lightboxRecord.title || "Report"}
                  style={{ transform: `scale(${lightboxZoom})`, transition: "transform 0.2s" }}
                  className="max-w-full rounded shadow-sm object-contain"
                />
              </div>

              {/* Lightbox Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.25, 3))}
                  >
                    <ZoomIn className="mr-1 h-3.5 w-3.5" /> Zoom In
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setLightboxZoom((prev) => Math.max(prev - 0.25, 0.5))}
                  >
                    <ZoomOut className="mr-1 h-3.5 w-3.5" /> Zoom Out
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => setLightboxZoom(1)}
                  >
                    Reset
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      const printWin = window.open(getAssetUrl(lightboxRecord.file_url), "_blank");
                      printWin?.focus();
                    }}
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    asChild
                  >
                    <a href={getAssetUrl(lightboxRecord.file_url)} download target="_blank" rel="noreferrer">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                    </a>
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => deleteRecordMutation.mutate(lightboxRecord._id)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

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

  // Clean any leftover URL search params on mount to avoid router confusion
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("patientId")) {
      const url = new URL(window.location.href);
      const pid = url.searchParams.get("patientId");
      if (pid && patients.length > 0 && !selectedPatient) {
        const found = patients.find((p) => p._id === pid || p.patientId === pid);
        if (found) setSelectedPatient(found);
      }
      try {
        window.history.replaceState({}, "", window.location.pathname);
      } catch {}
    }
  }, [patients, selectedPatient]);

  const handleViewPatient = (patient: PatientDto) => {
    setSelectedPatient(patient);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
  };

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
    onSuccess: (res: any) => {
      const patientId = res?.patientId || res?.data?.patientId;
      toast.success(`Patient registered successfully! ID: ${patientId || ""}`);
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

  const [activeTab, setActiveTab] = useState<"single" | "family" | "bulk">("single");

  // Family Form State
  const [familyName, setFamilyName] = useState("");
  const [sharedAddress, setSharedAddress] = useState(true);
  const [headData, setHeadData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "male" as PatientDto["gender"],
    dob: "",
    address: "",
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberInput[]>([]);

  // Bulk Upload State
  const [bulkRows, setBulkRows] = useState<ParsedBulkRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [bulkFilter, setBulkFilter] = useState<"all" | "valid" | "invalid">("all");

  const familyMutation = useMutation({
    mutationFn: (payload: any) => patientsApi.createFamily(payload),
    onSuccess: (res: any) => {
      toast.success(`Family registered successfully (${res.data?.total || "members"} added)`);
      setShowAddForm(false);
      setFamilyName("");
      setHeadData({ name: "", phone: "", email: "", gender: "male", dob: "", address: "" });
      setFamilyMembers([]);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to register family");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (patients: any[]) => patientsApi.bulkImport(patients),
    onSuccess: (res: any) => {
      const summary = res.data;
      toast.success(`Import complete: ${summary.successful} registered, ${summary.failed} failed`);
      setShowAddForm(false);
      setBulkRows([]);
      setBulkFileName("");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to import patients");
    },
  });

  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const excelImportMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return patientsApi.importExcel(formData);
    },
    onSuccess: (res: any) => {
      const summary = res.data || res;
      toast.success(res.message || `Import complete via S3: ${summary.count || 0} patients registered`);
      setShowAddForm(false);
      setSelectedExcelFile(null);
      setBulkRows([]);
      setBulkFileName("");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to import file via S3");
    },
  });

  const handleExportPatients = async () => {
    try {
      setIsExporting(true);
      const res = await patientsApi.exportExcel({ search });
      const downloadUrl = res?.data?.downloadUrl;
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
        toast.success(`Exported ${res?.data?.count ?? 0} patients to Excel`);
      } else {
        toast.error("Export did not return a download URL");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to export patients to Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateFamily = (e: FormEvent) => {
    e.preventDefault();
    if (!headData.name.trim()) {
      toast.error("Family Head Name is required");
      return;
    }
    if (!headData.phone.trim()) {
      toast.error("Family Head Phone is required");
      return;
    }
    if (!headData.email.trim()) {
      toast.error("Family Head Email is required");
      return;
    }

    familyMutation.mutate({
      familyName: familyName.trim() || `${headData.name.trim()}'s Family`,
      sharedAddress,
      head: {
        name: headData.name.trim(),
        phone: headData.phone.trim(),
        email: headData.email.trim(),
        gender: headData.gender,
        dob: headData.dob || undefined,
        address: { street: headData.address.trim() },
      },
      members: familyMembers.map((m) => ({
        name: m.name.trim(),
        phone: m.phone.trim() || headData.phone.trim(),
        email: m.email.trim() || undefined,
        gender: m.gender,
        dob: m.dob || undefined,
        relationship: m.relationship,
        address: sharedAddress ? { street: headData.address.trim() } : undefined,
      })),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    setSelectedExcelFile(file);

    if (file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setBulkRows(parsed);
        if (parsed.length === 0) {
          toast.error("No valid records found in file. Please ensure proper CSV format.");
        } else {
          const validCount = parsed.filter((r) => r.isValid).length;
          toast.info(`Loaded ${parsed.length} rows (${validCount} valid). Ready for S3 import.`);
        }
      };
      reader.readAsText(file);
    } else {
      setBulkRows([]);
      toast.info(`Spreadsheet "${file.name}" ready for secure AWS S3 import.`);
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: "",
        phone: headData.phone || "",
        email: "",
        gender: "other",
        dob: "",
        relationship: "Spouse",
      },
    ]);
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateFamilyMember = (id: string, field: keyof FamilyMemberInput, value: string) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // If a patient is selected, render the dedicated new page with Error Boundary (NO MODAL)!
  // Placed AFTER all hooks have executed so React hook order is 100% stable across all renders
  if (selectedPatient) {
    return (
      <DetailErrorBoundary onBack={handleBackToList}>
        <PatientDetailPage
          patient={selectedPatient}
          onBack={handleBackToList}
        />
      </DetailErrorBoundary>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Management</h1>
          <p className="text-sm text-muted-foreground">{patientsQuery.data?.pagination?.total || patients.length} registered patients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPatients}
            disabled={isExporting}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export to Excel"}
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Add Patient
          </Button>
        </div>
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
                    <button key={member._id} onClick={() => handleViewPatient(member)} className="flex w-full items-center justify-between rounded-lg bg-card p-2.5 text-sm transition-shadow hover:shadow-sm">
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
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleViewPatient(patient)} title="Open Patient Details & Medical Reports"><Eye className="h-3.5 w-3.5" /></Button>
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

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Registration</DialogTitle>
            <DialogDescription>Select registration mode: Single Patient, Family Group, or Bulk CSV/Excel</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single">Single Patient</TabsTrigger>
              <TabsTrigger value="family">Family Registration</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            </TabsList>

            {/* TAB 1: Single Patient (Existing form preserved) */}
            <TabsContent value="single" className="mt-4">
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <Input name="name" required placeholder="Patient name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date of Birth</label>
                    <Input name="dob" type="date" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Gender</label>
                    <Input name="gender" placeholder="male/female/other" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input name="phone" required placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input name="email" required type="email" placeholder="email@example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input name="address" placeholder="Full address" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Register Patient"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB 2: Family Registration */}
            <TabsContent value="family" className="mt-4 space-y-4">
              <form className="space-y-4" onSubmit={handleCreateFamily}>
                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                    <Users className="h-4 w-4" /> Family Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Family Group Name (Optional)</label>
                      <Input
                        placeholder="e.g. Sharma Family"
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="sharedAddressCheckbox"
                        checked={sharedAddress}
                        onChange={(e) => setSharedAddress(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="sharedAddressCheckbox" className="text-xs font-medium cursor-pointer">
                        Share Primary Head's address with all members
                      </label>
                    </div>
                  </div>
                </div>

                {/* Primary Head Details */}
                <div className="rounded-lg border p-4 space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      Family Head (Primary Contact) <span className="text-destructive">*</span>
                    </h4>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Head</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-xs font-medium">Full Name *</label>
                      <Input
                        required
                        placeholder="Head's full name"
                        value={headData.name}
                        onChange={(e) => setHeadData({ ...headData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Phone *</label>
                      <Input
                        required
                        placeholder="+91 XXXXX XXXXX"
                        value={headData.phone}
                        onChange={(e) => setHeadData({ ...headData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Email *</label>
                      <Input
                        required
                        type="email"
                        placeholder="head@example.com"
                        value={headData.email}
                        onChange={(e) => setHeadData({ ...headData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Date of Birth</label>
                      <Input
                        type="date"
                        value={headData.dob}
                        onChange={(e) => setHeadData({ ...headData, dob: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Gender</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={headData.gender}
                        onChange={(e) => setHeadData({ ...headData, gender: e.target.value as any })}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Address</label>
                      <Input
                        placeholder="Head's residential address"
                        value={headData.address}
                        onChange={(e) => setHeadData({ ...headData, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Family Members */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Additional Family Members ({familyMembers.length})</h4>
                    <Button type="button" size="sm" variant="outline" onClick={addFamilyMember}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Member
                    </Button>
                  </div>

                  {familyMembers.length === 0 && (
                    <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No additional members added yet. Click "+ Add Member" to add spouse, children, or parents.
                    </p>
                  )}

                  {familyMembers.map((member, index) => (
                    <div key={member.id} className="relative rounded-lg border p-3 bg-muted/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Member #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeFamilyMember(member.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-medium">Name *</label>
                          <Input
                            required
                            placeholder="Member name"
                            value={member.name}
                            onChange={(e) => updateFamilyMember(member.id, "name", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Relationship to Head</label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs"
                            value={member.relationship}
                            onChange={(e) => updateFamilyMember(member.id, "relationship", e.target.value)}
                          >
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Gender</label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs"
                            value={member.gender}
                            onChange={(e) => updateFamilyMember(member.id, "gender", e.target.value as any)}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Phone (Optional)</label>
                          <Input
                            placeholder={headData.phone || "Head's phone"}
                            value={member.phone}
                            onChange={(e) => updateFamilyMember(member.id, "phone", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Email (Optional)</label>
                          <Input
                            type="email"
                            placeholder="member@example.com"
                            value={member.email}
                            onChange={(e) => updateFamilyMember(member.id, "email", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Date of Birth</label>
                          <Input
                            type="date"
                            value={member.dob}
                            onChange={(e) => updateFamilyMember(member.id, "dob", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={familyMutation.isPending}>
                    {familyMutation.isPending ? "Registering Family..." : `Register Family (${familyMembers.length + 1} Patients)`}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB 3: Bulk Upload */}
            <TabsContent value="bulk" className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-primary" /> Download Standard Template
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use our verified template for individual patients and family groups.
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={downloadSampleTemplate}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download Template (.csv)
                </Button>
              </div>

              {/* Upload Drop Area */}
              <div className="rounded-lg border-2 border-dashed p-6 text-center hover:bg-muted/10 transition-colors">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <h5 className="mt-2 text-sm font-medium">Upload Patients Spreadsheet (Excel / CSV)</h5>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  Supported formats: .xlsx, .xls, .csv · Auto-processed securely via AWS S3
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4">
                    Select File (.xlsx / .csv)
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  {selectedExcelFile && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => excelImportMutation.mutate(selectedExcelFile)}
                      disabled={excelImportMutation.isPending}
                    >
                      <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                      {excelImportMutation.isPending ? "Uploading to S3..." : "Upload & Import via S3"}
                    </Button>
                  )}
                </div>
                {bulkFileName && (
                  <p className="mt-2 text-xs font-medium text-primary">Selected: {bulkFileName}</p>
                )}
              </div>

              {/* File Preview Table */}
              {bulkRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Total Records: {bulkRows.length}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> {bulkRows.filter((r) => r.isValid).length} Valid
                      </span>
                      {bulkRows.some((r) => !r.isValid) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          <AlertCircle className="h-3 w-3" /> {bulkRows.filter((r) => !r.isValid).length} Issues
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setBulkFilter("all")}
                        className={`px-2 py-1 rounded ${bulkFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkFilter("valid")}
                        className={`px-2 py-1 rounded ${bulkFilter === "valid" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        Valid
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkFilter("invalid")}
                        className={`px-2 py-1 rounded ${bulkFilter === "invalid" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        Errors
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr className="border-b">
                          <th className="p-2 text-left font-medium">Row</th>
                          <th className="p-2 text-left font-medium">Status</th>
                          <th className="p-2 text-left font-medium">Name</th>
                          <th className="p-2 text-left font-medium">Phone</th>
                          <th className="p-2 text-left font-medium">Email</th>
                          <th className="p-2 text-left font-medium">Family Group</th>
                          <th className="p-2 text-left font-medium">Errors / Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows
                          .filter((r) => {
                            if (bulkFilter === "valid") return r.isValid;
                            if (bulkFilter === "invalid") return !r.isValid;
                            return true;
                          })
                          .map((row) => (
                            <tr key={row.rowNum} className={`border-b ${!row.isValid ? "bg-destructive/5" : ""}`}>
                              <td className="p-2 font-mono">#{row.rowNum}</td>
                              <td className="p-2">
                                {row.isValid ? (
                                  <span className="text-emerald-600 font-medium">Ready</span>
                                ) : (
                                  <span className="text-destructive font-medium">Error</span>
                                )}
                              </td>
                              <td className="p-2 font-medium">{row.name || "-"}</td>
                              <td className="p-2 text-muted-foreground">{row.phone || "-"}</td>
                              <td className="p-2 text-muted-foreground">{row.email || "-"}</td>
                              <td className="p-2">{row.family_group || "-"}</td>
                              <td className="p-2">
                                {row.errors.length > 0 ? (
                                  <span className="text-destructive">{row.errors.join(", ")}</span>
                                ) : (
                                  <span className="text-muted-foreground">None</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      Only valid rows will be committed to the database.
                    </p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        disabled={bulkMutation.isPending || bulkRows.filter((r) => r.isValid).length === 0}
                        onClick={() => {
                          const validData = bulkRows.filter((r) => r.isValid);
                          bulkMutation.mutate(validData);
                        }}
                      >
                        {bulkMutation.isPending
                          ? "Importing..."
                          : `Import ${bulkRows.filter((r) => r.isValid).length} Valid Patients`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
