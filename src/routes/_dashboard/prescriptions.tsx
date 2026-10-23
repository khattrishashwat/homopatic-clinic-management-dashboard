import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Check,
  Download,
  Eraser,
  Eye,
  FileText,
  History,
  PenTool,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  Type,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  patientsApi,
  prescriptionsApi,
  mediaApi,
  type PatientDto,
  type PrescriptionDto,
} from "@/services/adminApi";
import { formatDate, getAge } from "@/lib/format";
import { getAssetUrl } from "@/utils/httpsclient";

export const Route = createFileRoute("/_dashboard/prescriptions")({
  component: PrescriptionsPage,
});

function PrescriptionsPage() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"pad" | "history">("pad");
  const [searchHistory, setSearchHistory] = useState("");
  const [previewRx, setPreviewRx] = useState<PrescriptionDto | null>(null);
  const [templateError, setTemplateError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Verify template image loading on mount
  useEffect(() => {
    const img = new Image();
    img.src = `${import.meta.env.BASE_URL}prescription_template.jpg`;
    img.onload = () => {
      setTemplateError(false);
    };
    img.onerror = () => {
      setTemplateError(true);
      toast.error(
        `Failed to load prescription template image from "${import.meta.env.BASE_URL}prescription_template.jpg". Please check the template file.`
      );
    };
  }, []);

  // Pad State
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(null);
  const [prescriptionDate, setPrescriptionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Vitals State (editable directly on left column)
  const [vitals, setVitals] = useState({
    height: "",
    weight: "",
    bp: "",
    pulse: "",
    spo2: "",
    temp: "",
    bsug: "",
  });

  // Advice State (editable on left bottom column)
  const [adviceText, setAdviceText] = useState("");

  // Rx Freeform Writing Area (editable on right column)
  const [rxText, setRxText] = useState("");

  // Drawing Canvas State (Pen Mode)
  const [drawingMode, setDrawingMode] = useState<"type" | "pen">("type");
  const [penColor, setPenColor] = useState<string>("#1e3a8a"); // Default Navy Blue ink
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Queries
  const prescriptionsQuery = useQuery({
    queryKey: ["prescriptions", searchHistory],
    queryFn: () => prescriptionsApi.list({ search: searchHistory, limit: 100 }),
  });
  const prescriptions = prescriptionsQuery.data?.data || [];

  const patientsQuery = useQuery({
    queryKey: ["patients-selector", patientSearch],
    queryFn: () => patientsApi.list({ search: patientSearch, limit: 20 }),
  });
  const availablePatients = patientsQuery.data?.data || [];

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (drawingMode !== "pen") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingMode !== "pen") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvasStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Generate Composite Canvas (Template + Text + Drawing)
  const generateCompositeCanvas = async (): Promise<HTMLCanvasElement> => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 791;
    exportCanvas.height = 1024;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not initialize canvas");

    // 1. Draw template background image
    const templateImg = new Image();
    templateImg.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      templateImg.onload = () => resolve();
      templateImg.onerror = () => {
        reject(
          new Error(
            `Prescription template image failed to load from "${import.meta.env.BASE_URL}prescription_template.jpg". Please ensure the template file exists in public/.`
          )
        );
      };
      templateImg.src = `${import.meta.env.BASE_URL}prescription_template.jpg`;
    });

    try {
      ctx.drawImage(templateImg, 0, 0, 791, 1024);
    } catch (err: any) {
      throw new Error(`Failed to draw prescription template onto canvas: ${err?.message || err}`);
    }

    // 2. Set Text Styles
    ctx.fillStyle = "#0f172a"; // Crisp dark slate
    ctx.font = "bold 13px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    // 3. Draw Patient Info on exact dotted lines
    if (selectedPatient) {
      // UID
      ctx.fillText(selectedPatient.patientId || "", 268, 250);
      // Name
      ctx.fillText(selectedPatient.name || "", 445, 250);
      // Age
      ctx.fillText(`${getAge(selectedPatient.dob)} yrs`, 268, 287);
      // Sex
      ctx.fillText(selectedPatient.gender || "-", 405, 287);
    }

    // Date
    const formattedDate = prescriptionDate
      ? new Date(prescriptionDate).toLocaleDateString("en-IN")
      : new Date().toLocaleDateString("en-IN");
    ctx.fillText(formattedDate, 545, 287);

    // 4. Draw Vitals in Left Column (placed right after each printed hyphen)
    ctx.font = "bold 12px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (vitals.height) ctx.fillText(vitals.height, 82, 305);
    if (vitals.weight) ctx.fillText(vitals.weight, 85, 353);
    if (vitals.bp) ctx.fillText(vitals.bp, 68, 401);
    if (vitals.pulse) ctx.fillText(vitals.pulse, 75, 459);
    if (vitals.spo2) ctx.fillText(vitals.spo2, 77, 514);
    if (vitals.temp) ctx.fillText(vitals.temp, 75, 571);
    if (vitals.bsug) ctx.fillText(vitals.bsug, 80, 626);

    // 5. Draw Advice in Left Column below Adv.
    if (adviceText) {
      ctx.font = "11px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      const advLines = adviceText.split("\n");
      let advY = 755;
      for (const line of advLines) {
        ctx.fillText(line, 18, advY);
        advY += 15;
        if (advY > 920) break;
      }
    }

    // 6. Draw Rx Medicines / Content in Right Area
    if (rxText) {
      ctx.font = "13px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      const rxLines = rxText.split("\n");
      let rxY = 370;
      for (const line of rxLines) {
        ctx.fillText(line, 215, rxY);
        rxY += 18;
        if (rxY > 925) break;
      }
    }

    // 7. Overlay Hand-drawn canvas strokes if any
    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0, 791, 1024);
    }

    return exportCanvas;
  };

  const generateCompositeImage = async (): Promise<string> => {
    const canvas = await generateCompositeCanvas();
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (payload: any) => prescriptionsApi.create(payload),
    onSuccess: (res: any) => {
      setIsUploading(false);
      const rxNo = res?.prescriptionNumber || res?.data?.prescriptionNumber || "";
      toast.success(
        `Prescription uploaded & saved successfully! ${rxNo ? `(${rxNo})` : ""}`
      );
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      // Clear pad
      setRxText("");
      setAdviceText("");
      setVitals({ height: "", weight: "", bp: "", pulse: "", spo2: "", temp: "", bsug: "" });
      clearCanvasStrokes();
      setActiveView("history");
    },
    onError: (err: any) => {
      setIsUploading(false);
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to upload prescription"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: prescriptionsApi.delete,
    onSuccess: () => {
      toast.success("Prescription removed");
      setPreviewRx(null);
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });

  const handleUploadAndSave = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first");
      return;
    }
    if (isUploading || uploadMutation.isPending) return;

    setIsUploading(true);
    try {
      toast.info("Preparing prescription image...");
      const exportCanvas = await generateCompositeCanvas();
      const patientIdStr = String(selectedPatient.patientId || selectedPatient._id);

      // 1. Convert canvas to JPEG blob
      const blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
      );

      if (!blob) {
        throw new Error("Failed to generate prescription image blob from canvas.");
      }

      // 2. Upload binary JPEG blob to S3 via /admin/media/upload
      toast.info("Uploading prescription image to S3...");
      const formData = new FormData();
      formData.append("file", blob, `prescription-${patientIdStr}-${Date.now()}.jpg`);
      formData.append("module", "prescriptions");
      formData.append("recordId", patientIdStr);
      formData.append("category", "pad");

      const mediaRes = await mediaApi.upload(formData);

      // Extract URL and S3 key from /admin/media/upload response
      const uploadedUrl =
        (mediaRes as any)?.url ||
        (mediaRes as any)?.data?.url ||
        (mediaRes as any)?.canonicalUrl ||
        (mediaRes as any)?.data?.canonicalUrl;

      const uploadedKey =
        (mediaRes as any)?.key ||
        (mediaRes as any)?.s3Key ||
        (mediaRes as any)?.data?.key ||
        (mediaRes as any)?.data?.s3Key;

      const uploadedBucket =
        (mediaRes as any)?.bucket ||
        (mediaRes as any)?.data?.bucket;

      if (!uploadedUrl && !uploadedKey) {
        throw new Error("Image upload did not return a valid URL or key.");
      }

      // 3. Send URL and prescription details to /admin/prescriptions (WITHOUT base64 imageData)
      uploadMutation.mutate({
        patientId: patientIdStr,
        prescriptionDate,
        imageUrl: uploadedUrl,
        image_url: uploadedUrl,
        image_s3_key: uploadedKey,
        image_s3_bucket: uploadedBucket,
        vitals: {
          height: vitals.height,
          weight: vitals.weight,
          bp: vitals.bp,
          pulse: vitals.pulse,
          spo2: vitals.spo2,
          temperature: vitals.temp,
          blood_sugar: vitals.bsug,
        },
        advice: {
          general: adviceText,
        },
        notes: rxText,
      });
    } catch (err: any) {
      setIsUploading(false);
      console.error("Prescription upload error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to upload prescription image");
    }
  };

  const handleDownloadDirectImage = async () => {
    try {
      const imageData = await generateCompositeImage();
      const a = document.createElement("a");
      a.href = imageData;
      const pId = (selectedPatient?.patientId || "Rx").replace(/[^a-zA-Z0-9]/g, "_");
      a.download = `Prescription_${pId}_${prescriptionDate}.jpg`;
      a.click();
      toast.success("Prescription image downloaded!");
    } catch (err: any) {
      toast.error("Download failed: " + err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 791px !important;
            height: 1024px !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Navigation & View Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">MD’s Homoeopathy Prescription Pad</h1>
          <p className="text-sm text-muted-foreground">
            Interactive Digital Letterhead — Type, scribble, and upload directly to patient records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeView === "pad" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("pad")}
          >
            <PenTool className="mr-1.5 h-4 w-4" /> Write on Pad
          </Button>
          <Button
            variant={activeView === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("history")}
          >
            <History className="mr-1.5 h-4 w-4" /> Prescription History ({prescriptions.length})
          </Button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: INTERACTIVE PRESCRIPTION PAD                           */}
      {/* ============================================================== */}
      {activeView === "pad" && (
        <div className="space-y-4">
          {/* Top Control Bar (Patient & Date Selector + Tools) */}
          <Card className="border-primary/20 bg-muted/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* 1. Patient Selector */}
                <div className="md:col-span-2 relative">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                    <User className="h-3.5 w-3.5 text-primary" /> Select Patient *
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Type patient name, phone, or Patient ID..."
                      value={selectedPatient ? `${selectedPatient.name} (${selectedPatient.patientId})` : patientSearch}
                      onChange={(e) => {
                        setSelectedPatient(null);
                        setPatientSearch(e.target.value);
                      }}
                      className="bg-background pr-8 font-medium"
                    />
                    {selectedPatient && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setPatientSearch("");
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {availablePatients.length > 0 && !selectedPatient && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-lg text-xs">
                      {availablePatients.map((p) => (
                        <div
                          key={p._id}
                          className="p-2.5 cursor-pointer hover:bg-muted transition-colors flex items-center justify-between border-b last:border-0"
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatientSearch("");
                          }}
                        >
                          <div>
                            <p className="font-semibold text-foreground">{p.name}</p>
                            <p className="text-muted-foreground font-mono">{p.patientId} · {p.phone}</p>
                          </div>
                          <span className="bg-primary/10 text-primary font-medium text-[11px] px-2 py-0.5 rounded">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Date Selector */}
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Prescription Date
                  </label>
                  <Input
                    type="date"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                    className="bg-background"
                  />
                </div>

                {/* 3. Action Button: Upload & Save */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    disabled={isUploading || uploadMutation.isPending || !selectedPatient}
                    onClick={handleUploadAndSave}
                  >
                    <UploadCloud className="mr-1.5 h-4 w-4" />
                    {isUploading || uploadMutation.isPending ? "Uploading..." : "Upload & Save"}
                  </Button>
                </div>
              </div>

              {/* Tools row (Pen / Type Toggle, Color, Download) */}
              <div className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">Input Mode:</span>
                  <div className="inline-flex rounded-md border bg-background p-0.5">
                    <button
                      type="button"
                      onClick={() => setDrawingMode("type")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                        drawingMode === "type"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Type className="h-3.5 w-3.5" /> Type Directly
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawingMode("pen")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                        drawingMode === "pen"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <PenTool className="h-3.5 w-3.5" /> Pen / Stylus Draw
                    </button>
                  </div>

                  {drawingMode === "pen" && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-[11px] text-muted-foreground">Ink:</span>
                      {["#1e3a8a", "#000000", "#b91c1c"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setPenColor(color)}
                          style={{ backgroundColor: color }}
                          className={`h-5 w-5 rounded-full border-2 ${
                            penColor === color ? "border-primary ring-2 ring-primary/30" : "border-white"
                          }`}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearCanvasStrokes}
                        className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Eraser className="mr-1 h-3 w-3" /> Clear Ink
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleDownloadDirectImage}
                    disabled={!selectedPatient}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" /> Download Image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* THE DIGITAL PRESCRIPTION PAD CONTAINER */}
          <div className="flex justify-center overflow-x-auto py-2">
            <div
              id="print-area"
              className="relative bg-white text-gray-900 shadow-2xl rounded-sm border border-gray-300 select-text"
              style={{
                width: "791px",
                height: "1024px",
                minWidth: "791px",
                minHeight: "1024px",
                backgroundImage: `url("${import.meta.env.BASE_URL}prescription_template.jpg")`,
                backgroundSize: "791px 1024px",
                backgroundRepeat: "no-repeat",
              }}
            >
              {templateError && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-50/95 border-2 border-dashed border-destructive/50 rounded-sm p-6 text-center">
                  <div className="rounded-full bg-destructive/10 p-3 mb-3">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-lg text-destructive">Template Image Failed to Load</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    The prescription template image could not be loaded from{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-foreground">
                      {`${import.meta.env.BASE_URL}prescription_template.jpg`}
                    </code>
                    . Please verify that the template image exists at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">public/prescription_template.jpg</code>.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      const retryImg = new Image();
                      retryImg.src = `${import.meta.env.BASE_URL}prescription_template.jpg?t=${Date.now()}`;
                      retryImg.onload = () => {
                        setTemplateError(false);
                        toast.success("Prescription template loaded successfully!");
                      };
                      retryImg.onerror = () => {
                        setTemplateError(true);
                        toast.error("Template image still cannot be loaded");
                      };
                    }}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retry Loading
                  </Button>
                </div>
              )}
              {/* 1. AUTO-FILLED PATIENT INFO OVER DOTTED LINES */}
              {/* UID */}
              <div
                className="absolute font-mono font-bold text-blue-900 text-[13px] leading-none"
                style={{ left: "268px", top: "238px", width: "100px" }}
              >
                {selectedPatient?.patientId || ""}
              </div>

              {/* Name */}
              <div
                className="absolute font-bold text-gray-900 text-[14px] leading-none truncate"
                style={{ left: "442px", top: "238px", width: "310px" }}
              >
                {selectedPatient?.name || ""}
              </div>

              {/* Age */}
              <div
                className="absolute font-semibold text-gray-900 text-[13px] leading-none"
                style={{ left: "268px", top: "274px", width: "70px" }}
              >
                {selectedPatient ? `${getAge(selectedPatient.dob)} yrs` : ""}
              </div>

              {/* Sex */}
              <div
                className="absolute font-semibold text-gray-900 text-[13px] leading-none"
                style={{ left: "405px", top: "274px", width: "60px" }}
              >
                {selectedPatient?.gender || ""}
              </div>

              {/* Date */}
              <div
                className="absolute font-semibold text-gray-900 text-[13px] leading-none"
                style={{ left: "542px", top: "274px", width: "160px" }}
              >
                {prescriptionDate
                  ? new Date(prescriptionDate).toLocaleDateString("en-IN")
                  : new Date().toLocaleDateString("en-IN")}
              </div>

              {/* 2. VITALS INPUTS (LEFT COLUMN) */}
              {/* Height */}
              <input
                type="text"
                placeholder="---"
                value={vitals.height}
                onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                className="absolute bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:bg-blue-50/50 outline-none font-bold text-[12px] px-1"
                style={{ left: "82px", top: "292px", width: "95px", height: "20px" }}
              />

              {/* Weight */}
              <input
                type="text"
                placeholder="---"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                className="absolute bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:bg-blue-50/50 outline-none font-bold text-[12px] px-1"
                style={{ left: "85px", top: "340px", width: "92px", height: "20px" }}
              />

              {/* B.P */}
              <input
                type="text"
                placeholder="---"
                value={vitals.bp}
                onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                className="absolute bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:bg-blue-50/50 outline-none font-bold text-[12px] px-1"
                style={{ left: "68px", top: "388px", width: "109px", height: "20px" }}
              />

              {/* Pulse */}
              <input
                type="text"
                placeholder="---"
                value={vitals.pulse}
                onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                className="absolute bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:bg-blue-50/50 outline-none font-bold text-[12px] px-1"
                style={{ left: "75px", top: "446px", width: "102px", height: "20px" }}
              />

              {/* SpO2 */}
              <input
                type="text"
                placeholder="---"
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                className="absolute bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:bg-blue-50/50 outline-none font-bold text-[12px] px-1"
                style={{ left: "77px", top: "501px", width: "100px", height: "20px" }}
              />

              {/* Temp */}
              <input
                type="text"
                placeholder="---"
                value={vitals.temp}
                onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                className="absolute bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:bg-blue-50/50 outline-none font-bold text-[12px] px-1"
                style={{ left: "75px", top: "558px", width: "102px", height: "20px" }}
              />

              {/* B.Sug */}
              <input
                type="text"
                placeholder="---"
                value={vitals.bsug}
                onChange={(e) => setVitals({ ...vitals, bsug: e.target.value })}
                className="absolute bg-transparent border-0 border-b border-transparent focus:border-blue-500 focus:bg-blue-50/50 outline-none font-bold text-[12px] px-1"
                style={{ left: "80px", top: "613px", width: "97px", height: "20px" }}
              />

              {/* Adv. (Advice Textarea in Left Column) */}
              <textarea
                placeholder="Write advice, diet restrictions, follow-up..."
                value={adviceText}
                onChange={(e) => setAdviceText(e.target.value)}
                className="absolute bg-transparent border-0 focus:bg-blue-50/40 rounded p-1 outline-none resize-none font-medium text-[11px] leading-tight"
                style={{ left: "16px", top: "745px", width: "160px", height: "175px" }}
              />

              {/* 3. Rx MAIN WRITING AREA (RIGHT COLUMN) */}
              <textarea
                placeholder="Type medicines, potency, dosage, frequency, instructions here...
Example:
1. Arsenicum Album 30C - 4 pills TDS before food
2. Bryonia Alba 200C - 4 pills BD after food
3. Rest & avoid cold water"
                value={rxText}
                onChange={(e) => setRxText(e.target.value)}
                className={`absolute bg-transparent border-0 focus:bg-blue-50/30 rounded p-2 outline-none resize-none text-[13px] leading-relaxed font-sans ${
                  drawingMode === "pen" ? "pointer-events-none opacity-90" : "pointer-events-auto"
                }`}
                style={{
                  left: "215px",
                  top: "355px",
                  width: "550px",
                  height: "565px",
                }}
              />

              {/* 4. TRANSPARENT HANDWRITING CANVAS LAYER */}
              <canvas
                ref={canvasRef}
                width={791}
                height={1024}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`absolute inset-0 ${
                  drawingMode === "pen"
                    ? "cursor-crosshair pointer-events-auto"
                    : "pointer-events-none"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: PRESCRIPTION HISTORY & UPLOADED RECORDS                */}
      {/* ============================================================== */}
      {activeView === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search history by Rx #, Patient Name, or ID..."
                className="pl-9"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
              />
            </div>

            <Button size="sm" onClick={() => setActiveView("pad")}>
              <Plus className="mr-1.5 h-4 w-4" /> New Prescription
            </Button>
          </div>

          {prescriptionsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Loading prescription records...</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescriptions.map((rx) => {
              const patientName = rx.patient_snapshot?.name || rx.patient?.name || "Patient";
              const patientId = rx.patient_snapshot?.patientId || rx.patient?.patientId || "-";
              const rxNumber = rx.prescriptionNumber || `RX-${rx._id.slice(-6).toUpperCase()}`;

              return (
                <Card
                  key={rx._id}
                  className="overflow-hidden border transition-all hover:shadow-md hover:border-primary/50"
                >
                  {/* Prescription Pad Thumbnail Preview */}
                  {(rx.image_url || rx.image_s3_key) ? (
                    <div
                      className="h-44 bg-muted/40 cursor-pointer overflow-hidden border-b flex items-center justify-center relative group"
                      onClick={() => setPreviewRx(rx)}
                    >
                      <img
                        src={getAssetUrl(rx.image_url || rx.image_s3_key)}
                        alt="Prescription"
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs">
                        <Eye className="mr-1.5 h-4 w-4" /> View Full Pad
                      </div>
                    </div>
                  ) : (
                    <div
                      className="h-32 bg-muted/20 cursor-pointer flex items-center justify-center border-b"
                      onClick={() => setPreviewRx(rx)}
                    >
                      <FileText className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}

                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          {rxNumber}
                        </span>
                        <h3 className="font-semibold text-foreground text-sm mt-1">{patientName}</h3>
                        <p className="font-mono text-xs text-muted-foreground">ID: {patientId}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(rx.prescription_date || rx.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-primary"
                        onClick={() => setPreviewRx(rx)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" /> View
                      </Button>

                      <div className="flex gap-1">
                        {(rx.image_url || rx.image_s3_key) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = getAssetUrl(rx.image_url || rx.image_s3_key);
                              a.download = `Prescription_${rxNumber}.jpg`;
                              a.target = "_blank";
                              a.click();
                            }}
                          >
                            <Download className="mr-1 h-3 w-3" /> Image
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(rx._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!prescriptionsQuery.isLoading && prescriptions.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
              <p className="font-medium">No prescriptions saved yet</p>
              <Button size="sm" className="mt-3" onClick={() => setActiveView("pad")}>
                <PenTool className="mr-1.5 h-4 w-4" /> Open Pad & Create First Rx
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: FULLSCREEN PRESCRIPTION PREVIEW                          */}
      {/* ============================================================== */}
      <Dialog open={Boolean(previewRx)} onOpenChange={() => setPreviewRx(null)}>
        <DialogContent className="max-h-[95vh] max-w-4xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {previewRx?.prescriptionNumber || "Prescription"} — {previewRx?.patient_snapshot?.name || previewRx?.patient?.name}
            </DialogTitle>
            <DialogDescription>
              Patient ID: {previewRx?.patient_snapshot?.patientId || previewRx?.patient?.patientId} · Date: {formatDate(previewRx?.prescription_date || previewRx?.created_at)}
            </DialogDescription>
          </DialogHeader>

          {previewRx && (
            <div className="space-y-4">
              {/* If an actual uploaded pad image exists */}
              {(previewRx.image_url || previewRx.image_s3_key) ? (
                <div className="flex justify-center bg-gray-100 rounded-lg p-2 border">
                  <img
                    src={getAssetUrl(previewRx.image_url || previewRx.image_s3_key)}
                    alt="Prescription Slip"
                    className="max-w-full rounded shadow-md border"
                    style={{ maxHeight: "75vh" }}
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p>Text-only Prescription (No Pad Image Available)</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                {(previewRx.image_url || previewRx.image_s3_key) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const printWin = window.open(getAssetUrl(previewRx.image_url || previewRx.image_s3_key), "_blank");
                      printWin?.focus();
                    }}
                  >
                    <Printer className="mr-1.5 h-4 w-4" /> Print Image
                  </Button>
                )}

                {(previewRx.image_url || previewRx.image_s3_key) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = getAssetUrl(previewRx.image_url || previewRx.image_s3_key);
                      a.download = `Prescription_${previewRx.prescriptionNumber || "pad"}.jpg`;
                      a.target = "_blank";
                      a.click();
                    }}
                  >
                    <Download className="mr-1.5 h-4 w-4" /> Download Image (JPG)
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(previewRx._id)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
