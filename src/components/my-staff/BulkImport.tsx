import { useState, useCallback, useRef, lazy, Suspense } from "react";
import { Upload, Download, X, Check, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { createStaffAuthUser } from "@/integrations/supabase/queries/staff";
import { toast } from "sonner";

interface BulkImportProps {
  schoolId: string;
  onClose: () => void;
  onComplete: (count: number) => void;
}

// Stage 1 + 2 columns for full import
const FULL_IMPORT_COLUMNS = [
  // Stage 1
  "first_name", "last_name", "salutation",
  "father_first_name", "father_middle_name", "father_last_name",
  "gender", "date_of_birth",
  "staff_type", "primary_designation", "custom_designation",
  "department", "joining_date",
  "personal_mobile", "login_mobile",
  "photo_url",
  // Stage 2
  "local_address", "permanent_address",
  "personal_email", "whatsapp_mobile",
  "emergency_contact_name", "emergency_contact_number", "emergency_contact_relation",
  "employment_status", "grade_level",
];

interface StaffRow {
  // Stage 1
  first_name: string;
  last_name: string;
  salutation?: string;
  father_first_name?: string;
  father_middle_name?: string;
  father_last_name?: string;
  gender: string;
  date_of_birth: string;
  staff_type?: string;
  primary_designation: string;
  custom_designation?: string;
  department: string;
  joining_date: string;
  personal_mobile: string;
  login_mobile: string;
  photo_url?: string;
  // Stage 2
  local_address?: string;
  permanent_address?: string;
  personal_email?: string;
  whatsapp_mobile?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relation?: string;
  employment_status?: string;
  grade_level?: string;
  // Computed
  full_name: string;
  staff_id?: string;
  status?: string;
  error?: string;
  profile_id?: string;
}

export function BulkImport({ schoolId, onClose, onComplete }: BulkImportProps) {
  const [step, setStep] = useState<"upload" | "review" | "processing">("upload");
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  // Validate a single row
  const validateRow = (row: StaffRow, index: number): string | null => {
    if (!row.first_name?.trim()) return `Row ${index + 1}: first_name required`;
    if (!row.last_name?.trim()) return `Row ${index + 1}: last_name required`;
    if (!row.gender?.trim()) return `Row ${index + 1}: gender required`;
    if (!row.date_of_birth?.trim()) return `Row ${index + 1}: date_of_birth required`;
    if (!row.primary_designation?.trim()) return `Row ${index + 1}: primary_designation required`;
    if (!row.department?.trim()) return `Row ${index + 1}: department required`;
    if (!row.joining_date?.trim()) return `Row ${index + 1}: joining_date required`;
    if (row.login_mobile && !row.login_mobile.match(/^\d{10}$/)) return `Row ${index + 1}: login_mobile must be 10 digits`;
    if (row.personal_mobile && !row.personal_mobile.match(/^\d{10}$/)) return `Row ${index + 1}: personal_mobile must be 10 digits`;
    return null;
  };

  // Lazy load xlsx only when user clicks download
  const getXLSX = useCallback(async () => {
    const module = await import("xlsx");
    return module;
  }, []);

  // Download template
  const handleDownloadTemplate = useCallback(async () => {
    const XLSX = await getXLSX();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      {
        first_name: "Rajesh", last_name: "Kumar", salutation: "Mr.",
        father_first_name: "Ramesh", father_middle_name: "", father_last_name: "Kumar",
        gender: "Male", date_of_birth: "1985-03-15",
        staff_type: "Teaching", primary_designation: "PGT",
        department: "Science", joining_date: "2024-04-01",
        personal_mobile: "9876543210", login_mobile: "9876543211",
        local_address: "123 Main Street, Bhopal",
        personal_email: "rajesh@example.com",
        emergency_contact_name: "Suresh Kumar",
        emergency_contact_number: "9876543212",
        emergency_contact_relation: "Brother",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Staff");
    XLSX.writeFile(wb, "Bulk_Import_Template.xlsx");
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const XLSX = await getXLSX();
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(sheet);

        if (json.length === 0) {
          toast.error("No data found in file");
          return;
        }

        // Check required columns
        const firstRow = json[0];
        const missing: string[] = [];
        const required = ["first_name", "last_name", "gender", "date_of_birth", "primary_designation", "department", "joining_date"];
        required.forEach((col) => {
          if (!(col in firstRow)) missing.push(col);
        });
        if (missing.length > 0) {
          toast.error(`Missing required columns: ${missing.join(", ")}`);
          return;
        }

        // Process rows with validation
        const validationErrors: string[] = [];
        const processed: StaffRow[] = json.map((row: any, index: number) => {
          const full_name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
          const mapped: StaffRow = {
            first_name: String(row.first_name ?? "").trim(),
            last_name: String(row.last_name ?? "").trim(),
            salutation: row.salutation ? String(row.salutation) : undefined,
            father_first_name: row.father_first_name ? String(row.father_first_name) : undefined,
            father_middle_name: row.father_middle_name ? String(row.father_middle_name) : undefined,
            father_last_name: row.father_last_name ? String(row.father_last_name) : undefined,
            gender: String(row.gender ?? "").trim(),
            date_of_birth: String(row.date_of_birth ?? "").trim(),
            staff_type: row.staff_type ? String(row.staff_type) : undefined,
            primary_designation: String(row.primary_designation ?? "").trim(),
            custom_designation: row.custom_designation ? String(row.custom_designation) : undefined,
            department: String(row.department ?? "").trim(),
            joining_date: String(row.joining_date ?? "").trim(),
            personal_mobile: row.personal_mobile ? String(row.personal_mobile) : "",
            login_mobile: row.login_mobile ? String(row.login_mobile) : "",
            photo_url: row.photo_url ? String(row.photo_url) : undefined,
            local_address: row.local_address ? String(row.local_address) : undefined,
            permanent_address: row.permanent_address ? String(row.permanent_address) : undefined,
            personal_email: row.personal_email ? String(row.personal_email) : undefined,
            whatsapp_mobile: row.whatsapp_mobile ? String(row.whatsapp_mobile) : undefined,
            emergency_contact_name: row.emergency_contact_name ? String(row.emergency_contact_name) : undefined,
            emergency_contact_number: row.emergency_contact_number ? String(row.emergency_contact_number) : undefined,
            emergency_contact_relation: row.emergency_contact_relation ? String(row.emergency_contact_relation) : undefined,
            employment_status: row.employment_status ? String(row.employment_status) : undefined,
            grade_level: row.grade_level ? String(row.grade_level) : undefined,
            full_name,
          };

          const err = validateRow(mapped, index);
          if (err) {
            mapped.error = err;
            validationErrors.push(err);
          }

          return mapped;
        });

        setRows(processed);
        setErrors(validationErrors);
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

  // Confirm and create staff (Edge Function handles auth + profile + staff atomically)
  const handleConfirm = useCallback(async () => {
    setProcessing(true);
    setStep("processing");

    const validRows = rows.filter((r) => !r.error);
    const created: string[] = [];
    const failed: string[] = [];
    const year = new Date().getFullYear();

    for (const row of validRows) {
      const role = row.staff_type === "Non-Teaching" ? "admin" : "teacher";

      const result = await createStaffAuthUser({
        schoolId,
        loginMobile: row.login_mobile,
        fullName: row.full_name,
        role,
        year,
        fatherFirstName: row.father_first_name,
        fatherMiddleName: row.father_middle_name,
        fatherLastName: row.father_last_name,
        gender: row.gender,
        dob: row.date_of_birth,
        salutation: row.salutation,
      });

      if (!result) {
        failed.push(`${row.login_mobile}: Failed to create staff`);
        continue;
      }

      // Update staff_profiles with bulk-import-only fields (the Edge Function created
      // a minimal row; we now enrich it with all the optional bulk-import fields)
      const { error: enrichErr } = await supabase
        .from("staff_profiles")
        .update({
          designation: row.primary_designation ?? null,
          department: row.department ?? null,
          joining_date: row.joining_date ?? null,
          local_address: row.local_address?.toUpperCase() || null,
          permanent_address: row.permanent_address?.toUpperCase() || null,
          personal_email: row.personal_email || null,
          whatsapp_mobile: row.whatsapp_mobile || null,
          emergency_contact_name: row.emergency_contact_name || null,
          emergency_contact_number: row.emergency_contact_number || null,
          emergency_contact_relation: row.emergency_contact_relation || null,
          employment_status: row.employment_status || null,
          grade_level: row.grade_level ?? null,
        })
        .eq("id", result.staffProfileId);

      if (enrichErr) {
        console.warn("Bulk import: enrich failed (staff created, some fields missing):", enrichErr.message);
      }

      created.push(result.employeeId);
    }

    setProcessing(false);

    if (created.length > 0) {
      toast.success(`${created.length} staff imported successfully`);
      onComplete(created.length);
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} failed: ${failed[0]}`);
    }
  }, [rows, schoolId, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:max-h-[85vh] bg-background border rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Bulk Full Import</h2>
            <p className="text-sm text-muted-foreground">Upload Excel with Stage 1 + 2 fields</p>
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
              <Button onClick={handleConfirm} disabled={rows.some((r) => !r.error && r.status !== "ready")}>
                <Check className="h-4 w-4 mr-2" />
                Import {rows.filter((r) => !r.error).length} Staff
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
          id="bulk-import-upload"
          onChange={onFileUpload}
        />
        <label htmlFor="bulk-import-upload" className="cursor-pointer block">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Click to upload Excel file</p>
          <p className="text-sm text-muted-foreground mt-1">.xlsx or .xls</p>
        </label>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={onDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm font-medium mb-2">Required columns (Stage 1):</p>
        <div className="flex flex-wrap gap-2">
          {["first_name", "last_name", "gender", "date_of_birth", "primary_designation", "department", "joining_date"].map((col) => (
            <Badge key={col} variant="secondary">{col}</Badge>
          ))}
        </div>
        <p className="text-sm font-medium mt-3 mb-2">Optional columns:</p>
        <div className="flex flex-wrap gap-2">
          {["salutation", "personal_mobile", "login_mobile", "staff_type", "local_address", "personal_email", "emergency_contact_name", "emergency_contact_number", "employment_status"].map((col) => (
            <Badge key={col} variant="outline">{col}</Badge>
          ))}
        </div>
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
  const validCount = rows.filter((r) => !r.error).length;
  const errorCount = rows.filter((r) => r.error).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm">
            <strong>{validCount}</strong> valid rows, <strong className="text-destructive">{errorCount}</strong> with errors
          </p>
          {errors.length > 0 && (
            <Badge variant="destructive">{errors.length} errors</Badge>
          )}
        </div>
        {!reserved && (
          <Button onClick={() => { onReserveIds(); setReserved(true); }}>
            Reserve Staff IDs
          </Button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 max-h-[120px] overflow-auto">
          <p className="text-sm font-medium text-destructive mb-1">Validation errors:</p>
          {errors.slice(0, 10).map((err, i) => (
            <p key={i} className="text-xs text-destructive">{err}</p>
          ))}
          {errors.length > 10 && (
            <p className="text-xs text-muted-foreground">...and {errors.length - 10} more</p>
          )}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden max-h-[350px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Staff ID</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Designation</th>
              <th className="px-3 py-2 text-left font-medium">Department</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-t ${row.error ? "bg-destructive/5" : ""}`}>
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2 font-mono">{row.staff_id ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2">{row.full_name}</td>
                <td className="px-3 py-2">{row.primary_designation}</td>
                <td className="px-3 py-2">{row.department}</td>
                <td className="px-3 py-2">
                  {row.error ? (
                    <span className="text-destructive text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Error
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
      <p className="text-lg font-medium">Importing staff...</p>
      <p className="text-sm text-muted-foreground">Creating profiles, extended data, assigning IDs</p>
    </div>
  );
}