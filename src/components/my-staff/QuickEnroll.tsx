import { useState, useCallback, useRef } from "react";
import { Upload, Download, X, Check, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { createStaffAuthUser } from "@/integrations/supabase/queries/staff";
import { toast } from "sonner";

interface QuickEnrollProps {
  schoolId: string;
  onClose: () => void;
  onComplete: (count: number) => void;
}

interface StaffRow {
  first_name: string;
  last_name: string;
  father_first_name: string;
  father_middle_name?: string;
  father_last_name: string;
  gender: string;
  date_of_birth: string;
  login_mobile: string;
  // Auto-filled
  full_name: string;
  staff_id?: string;
  status?: string;
  error?: string;
  profile_id?: string;
}

const TEMPLATE_COLUMNS = [
  "first_name", "last_name", "father_first_name", "father_middle_name", "father_last_name",
  "gender", "date_of_birth", "login_mobile",
];

const REQUIRED_COLUMNS = TEMPLATE_COLUMNS;

export function QuickEnroll({ schoolId, onClose, onComplete }: QuickEnrollProps) {
  const [step, setStep] = useState<"upload" | "review" | "processing">("upload");
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  // Download template
  const handleDownloadTemplate = useCallback(async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      {
        first_name: "Rajesh",
        last_name: "Kumar",
        father_first_name: "Ramesh",
        father_middle_name: "",
        father_last_name: "Kumar",
        gender: "Male",
        date_of_birth: "1985-03-15",
        login_mobile: "9876543210",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Staff");
    XLSX.writeFile(wb, "Quick_Enroll_Template.xlsx");
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(sheet);

        if (json.length === 0) {
          toast.error("No data found in file");
          return;
        }

        // Validate required columns
        const firstRow = json[0];
        const missing = REQUIRED_COLUMNS.filter((col) => !(col in firstRow));
        if (missing.length > 0) {
          toast.error(`Missing columns: ${missing.join(", ")}`);
          return;
        }

        // Process rows
        const processed: StaffRow[] = json.map((row: any, index: number) => {
          const full_name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
          return {
            first_name: String(row.first_name ?? "").trim(),
            last_name: String(row.last_name ?? "").trim(),
            father_first_name: String(row.father_first_name ?? "").trim(),
            father_middle_name: String(row.father_middle_name ?? "").trim(),
            father_last_name: String(row.father_last_name ?? "").trim(),
            gender: String(row.gender ?? "").trim(),
            date_of_birth: String(row.date_of_birth ?? "").trim(),
            login_mobile: String(row.login_mobile ?? "").trim(),
            full_name,
          };
        });

        setRows(processed);
        setStep("review");
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Reserve staff IDs (preview only — actual reservation happens in handleConfirm via Edge Function)
  const handleReserveIds = useCallback(async () => {
    // No-op: Edge Function reserves + commits atomically during confirm.
    // We just mark rows as ready so the confirm button enables.
    const updated = rows.map((r) => ({ ...r, status: "ready" as const }));
    setRows(updated);
  }, [rows]);

  // Confirm and create staff (single Edge Function call per row handles auth + profile + staff)
  const handleConfirm = useCallback(async () => {
    setProcessing(true);
    setStep("processing");

    const created: string[] = [];
    const failed: string[] = [];
    const year = new Date().getFullYear();

    for (const row of rows) {
      if (row.error) continue;

      const result = await createStaffAuthUser({
        schoolId,
        loginMobile: row.login_mobile,
        fullName: row.full_name,
        role: "teacher",
        year,
        fatherFirstName: row.father_first_name,
        fatherMiddleName: row.father_middle_name,
        fatherLastName: row.father_last_name,
        gender: row.gender,
        dob: row.date_of_birth,
      });

      if (!result) {
        failed.push(`Row ${row.login_mobile}: Failed to create staff`);
        continue;
      }
      created.push(result.employeeId);
    }

    setProcessing(false);

    if (created.length > 0) {
      toast.success(`${created.length} staff enrolled successfully`);
      onComplete(created.length);
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} failed: ${failed[0]}`);
    }
  }, [rows, schoolId, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[700px] md:max-h-[85vh] bg-background border rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Quick Staff Enrollment</h2>
            <p className="text-sm text-muted-foreground">Upload Excel with basic info to enroll staff quickly</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === "upload" && (
            <UploadStep onFileUpload={handleFileUpload} onDownloadTemplate={handleDownloadTemplate} />
          )}

          {step === "review" && (
            <ReviewStep
              rows={rows}
              onReserveIds={handleReserveIds}
              errors={errors}
            />
          )}

          {step === "processing" && (
            <ProcessingStep />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={rows.some((r) => r.error || r.status !== "ready")}>
                <Check className="h-4 w-4 mr-2" />
                Enroll {rows.length} Staff
              </Button>
            </>
          )}
          {step === "processing" && (
            <Button onClick={onClose}>Done</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadStep({
  onFileUpload,
  onDownloadTemplate,
}: {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary transition-colors">
        <input
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          id="quick-enroll-upload"
          onChange={onFileUpload}
        />
        <label htmlFor="quick-enroll-upload" className="cursor-pointer block">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Click to upload Excel file</p>
          <p className="text-sm text-muted-foreground mt-1">or drag and drop .xlsx or .xls</p>
        </label>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={onDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm font-medium mb-2">Required columns:</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_COLUMNS.map((col) => (
            <Badge key={col} variant="secondary">{col}</Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          All other fields auto-defaulted: role=Teacher, status=Active, profile ~30% complete
        </p>
      </div>
    </div>
  );
}

function ReviewStep({
  rows,
  onReserveIds,
  errors,
}: {
  rows: StaffRow[];
  onReserveIds: () => void;
  errors: string[];
}) {
  const [reserved, setReserved] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          Found <strong>{rows.length}</strong> rows. Click "Reserve IDs" to auto-assign staff IDs.
        </p>
        {!reserved && (
          <Button onClick={() => { onReserveIds(); setReserved(true); }}>
            Reserve Staff IDs
          </Button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive font-medium">Errors:</p>
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-destructive">{err}</p>
          ))}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Staff ID</th>
              <th className="px-3 py-2 text-left font-medium">Full Name</th>
              <th className="px-3 py-2 text-left font-medium">Mobile</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2 font-mono">{row.staff_id ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2">{row.full_name}</td>
                <td className="px-3 py-2">{row.login_mobile}</td>
                <td className="px-3 py-2">
                  {row.error ? (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {row.error}
                    </span>
                  ) : row.staff_id ? (
                    <Badge variant="secondary" className="text-xs">Ready</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProcessingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-medium">Enrolling staff...</p>
      <p className="text-sm text-muted-foreground">Creating profiles and assigning IDs</p>
    </div>
  );
}