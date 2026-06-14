import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2, X, Upload, Check, ChevronRight, ChevronLeft, Loader2, Lock, Unlock, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { useGuardedSubmit } from "@/hooks/useGuardedSubmit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createStaffAuthUser, updateStaffProfilePartial, updateStaffProfileFull, type StaffTabKey } from "@/integrations/supabase/queries/staff";
import type { StaffFormData } from "@/lib/schemas";

// ─── Constants ───────────────────────────────────────────────────────────────

const QUALIFICATION_LEVELS = [
  "Secondary", "Sr. Secondary", "Graduation", "Post Graduation",
  "M.Phil", "Ph.D.", "N.T.T.", "B.Ed.", "D.El.Ed.", "M.Ed.", "CTET", "MPTET", "Any Other",
];

const RELIGIONS = [
  "Buddhism", "Christianity", "Hinduism", "Islam", "Judaism", "Sikhism",
  "Atheist", "Zoroastrianism", "Jainism", "Non-Religious", "Other",
];

const STATES_INDIA = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BOARD_TYPES = ["CBSE", "ICSE", "IB", "State Board", "Private", "Other"];

const EMPLOYMENT_TYPES = ["Permanent", "Probation", "Contract", "Part-Time", "Guest", "Substitute"];

const DOCUMENT_TYPES = [
  "Appointment Letter", "Experience Certificate", "Highest Degree Certificate",
  "B.Ed. / Teaching Certification", "CTET / MPTET / TET Certificate",
  "Aadhar Card", "PAN Card", "Caste Certificate", "Salary Certificate",
  "Police Verification", "Medical Fitness", "Bank Passbook", "Disability Certificate",
];

// ─── Types ───────────────────────────────────────────────────────────────────

export type StaffTabId = StaffTabKey; // 'tab1' | 'tab2' | ... | 'tab7'
export const STAFF_TABS: { id: StaffTabId; label: string; }[] = [
  { id: "tab1", label: "Identity" },
  { id: "tab2", label: "Personal & Contact" },
  { id: "tab3", label: "Professional" },
  { id: "tab4", label: "Education" },
  { id: "tab5", label: "Experience" },
  { id: "tab6", label: "Payroll" },
  { id: "tab7", label: "Statutory" },
];

export interface StaffFormIdentity {
  employeeId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fatherFirstName?: string;
  fatherMiddleName?: string;
  fatherLastName?: string;
}

export interface StaffFormProps {
  schoolId: string;
  initialData?: Partial<StaffFormData>;
  onSave: (data: StaffFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  onRequestStageReset?: () => void;
  currentTab?: StaffTabId;
  onTabChange?: (tab: StaffTabId) => void;
  staffProfileId?: string;
  /** "create" = new staff; locks tabs 2-7 until staffId is generated. "edit" = freely navigable. */
  mode?: "create" | "edit";
  /** Fired when user attempts to close/cancel the form while still in create-locked mode. Overlay should show abandon dialog. */
  onAbandon?: () => void;
  /** Called whenever the Tab 1 identity-relevant fields change, so a parent can show them in a persistent header. */
  onIdentityChange?: (identity: StaffFormIdentity) => void;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label, required, error, children, className,
}: {
  label: string; required?: boolean; error?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className={cn(error && "text-destructive")}>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FieldGroup({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

// ─── Tab 1: Identity (locked after Staff_ID generated) ───────────────────────

function Tab1Identity({
  data, set, errors, staffId, locked, onUnlockRequest,
}: {
  data: Partial<StaffFormData>;
  set: (k: string, v: unknown) => void;
  errors: Partial<Record<string, string>>;
  staffId?: string;
  locked: boolean;
  onUnlockRequest: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Core Identity</p>
          {staffId ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-sm px-3 py-1">{staffId}</Badge>
              <span className="text-xs text-green-600 font-medium">Staff ID active</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Fill required fields to generate Staff ID</p>
          )}
        </div>
        {locked && (
          <Button variant="outline" size="sm" onClick={onUnlockRequest} className="gap-1.5 cursor-pointer">
            <Unlock className="h-3.5 w-3.5" /> Edit Core Identity
          </Button>
        )}
      </div>

      {locked && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Core identity locked after Staff ID creation. Click &quot;Edit Core Identity&quot; to modify.</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First Name" required error={errors.firstName}>
          <Input value={data.firstName || ""} onChange={(e) => set("firstName", e.target.value)} className="clay-input" maxLength={30} disabled={locked} />
        </Field>
        <Field label="Middle Name" error={errors.middleName}>
          <Input value={data.middleName || ""} onChange={(e) => set("middleName", e.target.value)} className="clay-input" maxLength={30} disabled={locked} />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <Input value={data.lastName || ""} onChange={(e) => set("lastName", e.target.value)} className="clay-input" maxLength={30} disabled={locked} />
        </Field>
        <Field label="Father First Name" required error={errors.fatherFirstName}>
          <Input value={data.fatherFirstName || ""} onChange={(e) => set("fatherFirstName", e.target.value)} className="clay-input" maxLength={30} disabled={locked} />
        </Field>
        <Field label="Father Middle Name" error={errors.fatherMiddleName}>
          <Input value={data.fatherMiddleName || ""} onChange={(e) => set("fatherMiddleName", e.target.value)} className="clay-input" maxLength={30} disabled={locked} />
        </Field>
        <Field label="Father Last Name" required error={errors.fatherLastName}>
          <Input value={data.fatherLastName || ""} onChange={(e) => set("fatherLastName", e.target.value)} className="clay-input" maxLength={30} disabled={locked} />
        </Field>
        <Field label="Gender" required error={errors.gender}>
          <Select value={data.gender || ""} onValueChange={(v) => set("gender", v)} disabled={locked}>
            <SelectTrigger className="clay-input"><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              {["Male", "Female", "Other"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Login Mobile" required error={errors.loginMobile}>
          <Input type="tel" value={data.loginMobile || ""} onChange={(e) => set("loginMobile", e.target.value)} className="clay-input" placeholder="10-digit mobile" disabled={locked} />
        </Field>
        <Field label="Year of Joining" required error={errors.yearOfJoining}>
          <Input
            type="number"
            value={data.yearOfJoining || new Date().getFullYear()}
            onChange={(e) => set("yearOfJoining", parseInt(e.target.value))}
            className="clay-input"
            min={2000}
            max={2100}
            disabled={locked}
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Tab 2: Personal & Contact ───────────────────────────────────────────────

function Tab2PersonalContact({
  data, set, errors,
}: {
  data: Partial<StaffFormData>;
  set: (k: string, v: unknown) => void;
  errors: Partial<Record<string, string>>;
}) {
  const local = (data as any).localAddress || {};
  const perm = (data as any).permanentAddress || {};
  const languages: any[] = (data as any).languages || [];
  const children: any[] = (data as any).children || [];
  const needsSubcaste = data.category && ["SC", "ST", "OBC"].includes(data.category);
  const showSpouse = data.maritalStatus === "Married" || data.maritalStatus === "Widowed";
  const showHusband = data.maritalStatus === "Married" && data.gender === "Female";
  const showMarriageDate = data.maritalStatus === "Married";

  const addLanguage = () => set("languages", [...languages, { language: "", canSpeak: false, canRead: false, canWrite: false }]);
  const updateLanguage = (i: number, v: any) => {
    const next = [...languages]; next[i] = v; set("languages", next);
  };
  const removeLanguage = (i: number) => set("languages", languages.filter((_: any, j: number) => j !== i));

  const addChild = () => set("children", [...children, { name: "", age: undefined, sex: undefined, classSchool: "" }]);
  const updateChild = (i: number, v: any) => {
    const next = [...children]; next[i] = v; set("children", next);
  };
  const removeChild = (i: number) => set("children", children.filter((_: any, j: number) => j !== i));

  return (
    <div className="space-y-6">
      <FieldGroup title="Personal & Demographics">
        <Field label="Date of Birth" required error={errors.dateOfBirth}>
          <Input type="date" value={(data as any).dateOfBirth || ""} onChange={(e) => set("dateOfBirth", e.target.value)} className="clay-input" />
        </Field>
        <Field label="Photo" error={undefined}>
          <Input type="file" accept="image/png,image/jpeg" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) set("photoUrl", URL.createObjectURL(f));
          }} className="clay-input" />
        </Field>
        <Field label="Nationality" error={undefined}>
          <Select value={data.nationality || "Indian"} onValueChange={(v) => set("nationality", v)}>
            <SelectTrigger className="clay-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Indian">Indian</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Blood Group" error={undefined}>
          <Select value={data.bloodGroup || ""} onValueChange={(v) => set("bloodGroup", v)}>
            <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <FieldGroup title="Languages Known" subtitle="Add language and toggle Speak / Read / Write">
        <div className="sm:col-span-2 space-y-2">
          {languages.map((l, i) => (
            <div key={i} className="flex items-center gap-2 p-2 border rounded-lg">
              <Input value={l.language} onChange={(e) => updateLanguage(i, { ...l, language: e.target.value })} placeholder="Language" className="clay-input flex-1" />
              <label className="flex items-center gap-1 text-xs">
                <Checkbox checked={l.canSpeak} onCheckedChange={(c) => updateLanguage(i, { ...l, canSpeak: !!c })} /> Speak
              </label>
              <label className="flex items-center gap-1 text-xs">
                <Checkbox checked={l.canRead} onCheckedChange={(c) => updateLanguage(i, { ...l, canRead: !!c })} /> Read
              </label>
              <label className="flex items-center gap-1 text-xs">
                <Checkbox checked={l.canWrite} onCheckedChange={(c) => updateLanguage(i, { ...l, canWrite: !!c })} /> Write
              </label>
              <Button variant="ghost" size="icon" onClick={() => removeLanguage(i)} className="text-destructive cursor-pointer"><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addLanguage} className="cursor-pointer"><Plus className="h-4 w-4 mr-1.5" /> Add Language</Button>
        </div>
      </FieldGroup>

      <FieldGroup title="Social / Category">
        <Field label="Category" required error={errors.category}>
          <Select value={data.category || ""} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["General", "SC", "ST", "OBC"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {needsSubcaste && (
          <>
            <Field label="Subcaste" required error={errors.subcaste}>
              <Input value={data.subcaste || ""} onChange={(e) => set("subcaste", e.target.value)} className="clay-input" maxLength={100} />
            </Field>
            <Field label="Caste Certificate Number" required error={errors.casteCertificateNumber}>
              <Input value={data.casteCertificateNumber || ""} onChange={(e) => set("casteCertificateNumber", e.target.value)} className="clay-input" maxLength={60} />
            </Field>
          </>
        )}
        <Field label="Religion / Belief" error={undefined}>
          <Select value={data.religion || ""} onValueChange={(v) => set("religion", v)}>
            <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {RELIGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {data.religion === "Other" && (
          <Field label="Religion (specify)" required error={errors.religionSpecify}>
            <Input value={data.religionSpecify || ""} onChange={(e) => set("religionSpecify", e.target.value)} className="clay-input" maxLength={60} />
          </Field>
        )}
        <div className="flex items-center gap-2 sm:col-span-2">
          <Switch checked={data.minority || false} onCheckedChange={(v) => set("minority", v)} />
          <span className="text-sm">Minority</span>
        </div>
      </FieldGroup>

      <FieldGroup title="Family">
        <Field label="Marital Status" error={undefined}>
          <Select value={data.maritalStatus || ""} onValueChange={(v) => set("maritalStatus", v)}>
            <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["Unmarried", "Married", "Widowed", "Divorced", "Separated"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {showMarriageDate && (
          <Field label="Date of Marriage" required error={errors.dateOfMarriage}>
            <Input type="date" value={(data as any).dateOfMarriage || ""} onChange={(e) => set("dateOfMarriage", e.target.value)} className="clay-input" />
          </Field>
        )}
        {showSpouse && (
          <>
            <Field label="Spouse Name" error={undefined}>
              <Input value={(data as any).spouseName || ""} onChange={(e) => set("spouseName", e.target.value)} className="clay-input" maxLength={120} />
            </Field>
            <Field label="Spouse Occupation" error={undefined}>
              <Input value={(data as any).spouseOccupation || ""} onChange={(e) => set("spouseOccupation", e.target.value)} className="clay-input" maxLength={120} />
            </Field>
            <Field label="Spouse Contact" error={errors.spouseContact}>
              <Input type="tel" value={(data as any).spouseContact || ""} onChange={(e) => set("spouseContact", e.target.value)} className="clay-input" placeholder="10-digit mobile" maxLength={10} />
            </Field>
          </>
        )}
        <Field label={showHusband ? "Husband's Occupation" : "Father's Occupation"} error={undefined}>
          <Input value={(showHusband ? (data as any).husbandOccupation : (data as any).fatherOccupation) || ""}
            onChange={(e) => set(showHusband ? "husbandOccupation" : "fatherOccupation", e.target.value)} className="clay-input" maxLength={120} />
        </Field>
        <Field label={showHusband ? "Husband's Contact" : "Father's Contact"} error={undefined}>
          <Input type="tel" value={(showHusband ? (data as any).husbandContact : (data as any).fatherContact) || ""}
            onChange={(e) => set(showHusband ? "husbandContact" : "fatherContact", e.target.value)} className="clay-input" placeholder="10-digit mobile" maxLength={10} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Children" subtitle="Conditional — appears if Has Children = Yes">
        <div className="sm:col-span-2 flex items-center gap-2">
          <Switch checked={data.hasChildren || false} onCheckedChange={(v) => set("hasChildren", v)} />
          <span className="text-sm">Has Children</span>
        </div>
        {data.hasChildren && (
          <div className="sm:col-span-2 space-y-2">
            {children.map((c, i) => (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2 border rounded-lg items-end">
                <Input value={c.name} onChange={(e) => updateChild(i, { ...c, name: e.target.value })} placeholder="Name" className="clay-input" />
                <Input type="number" value={c.age ?? ""} onChange={(e) => updateChild(i, { ...c, age: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="Age" className="clay-input" />
                <Select value={c.sex || ""} onValueChange={(v) => updateChild(i, { ...c, sex: v })}>
                  <SelectTrigger className="clay-input"><SelectValue placeholder="Sex" /></SelectTrigger>
                  <SelectContent>
                    {["Male", "Female", "Other"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={c.classSchool || ""} onChange={(e) => updateChild(i, { ...c, classSchool: e.target.value })} placeholder="Class & School" className="clay-input" />
                <Button variant="ghost" size="icon" onClick={() => removeChild(i)} className="text-destructive cursor-pointer"><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            {children.length < 5 && (
              <Button variant="outline" size="sm" onClick={addChild} className="cursor-pointer"><Plus className="h-4 w-4 mr-1.5" /> Add Child</Button>
            )}
          </div>
        )}
      </FieldGroup>

      <FieldGroup title="Contact">
        <Field label="Primary Mobile" error={undefined}>
          <Input value={data.loginMobile || ""} disabled className="clay-input bg-muted" />
        </Field>
        <Field label="Secondary Mobile" error={errors.secondaryMobile}>
          <Input type="tel" value={(data as any).secondaryMobile || ""} onChange={(e) => set("secondaryMobile", e.target.value)} className="clay-input" placeholder="10-digit mobile" maxLength={10} />
        </Field>
        <Field label="Personal Email" error={errors.personalEmail}>
          <Input type="email" value={data.personalEmail || ""} onChange={(e) => set("personalEmail", e.target.value)} className="clay-input" />
        </Field>
        <Field label="Emergency Contact Name" required error={errors.emergencyContactName}>
          <Input value={data.emergencyContactName || ""} onChange={(e) => set("emergencyContactName", e.target.value)} className="clay-input" maxLength={120} />
        </Field>
        <Field label="Emergency Contact Number" required error={errors.emergencyContactNumber}>
          <Input type="tel" value={data.emergencyContactNumber || ""} onChange={(e) => set("emergencyContactNumber", e.target.value)} className="clay-input" placeholder="10-digit mobile" maxLength={10} />
        </Field>
        <Field label="Emergency Contact Relation" required error={errors.emergencyContactRelation}>
          <Input value={data.emergencyContactRelation || ""} onChange={(e) => set("emergencyContactRelation", e.target.value)} className="clay-input" placeholder="Spouse, Parent, Sibling" maxLength={60} />
        </Field>
      </FieldGroup>

      <FieldGroup title="Local Address" subtitle="Current residential address">
        <Field label="Address Line 1" required error={undefined}>
          <Input value={local.line1 || ""} onChange={(e) => set("localAddress", { ...local, line1: e.target.value })} className="clay-input" maxLength={200} />
        </Field>
        <Field label="City / Village" required error={undefined}>
          <Input value={local.cityVillage || ""} onChange={(e) => set("localAddress", { ...local, cityVillage: e.target.value })} className="clay-input" maxLength={80} />
        </Field>
        <Field label="District" required error={undefined}>
          <Input value={local.district || ""} onChange={(e) => set("localAddress", { ...local, district: e.target.value })} className="clay-input" maxLength={80} />
        </Field>
        <Field label="State" required error={undefined}>
          <Select value={local.state || ""} onValueChange={(v) => set("localAddress", { ...local, state: v })}>
            <SelectTrigger className="clay-input"><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {STATES_INDIA.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="PIN Code" required error={undefined}>
          <Input value={local.pinCode || ""} onChange={(e) => set("localAddress", { ...local, pinCode: e.target.value })} className="clay-input" placeholder="6-digit PIN" maxLength={6} />
        </Field>
        <div className="sm:col-span-2 flex items-center gap-2">
          <Switch checked={data.sameAsLocalAddress ?? true} onCheckedChange={(v) => set("sameAsLocalAddress", v)} />
          <span className="text-sm">Same as Local Address (uncheck to fill permanent address)</span>
        </div>
      </FieldGroup>

      {!data.sameAsLocalAddress && (
        <FieldGroup title="Permanent Address">
          <Field label="Address Line 1" required error={undefined}>
            <Input value={perm.line1 || ""} onChange={(e) => set("permanentAddress", { ...perm, line1: e.target.value })} className="clay-input" />
          </Field>
          <Field label="City / Village" required error={undefined}>
            <Input value={perm.cityVillage || ""} onChange={(e) => set("permanentAddress", { ...perm, cityVillage: e.target.value })} className="clay-input" />
          </Field>
          <Field label="District" required error={undefined}>
            <Input value={perm.district || ""} onChange={(e) => set("permanentAddress", { ...perm, district: e.target.value })} className="clay-input" />
          </Field>
          <Field label="State" required error={undefined}>
            <Select value={perm.state || ""} onValueChange={(v) => set("permanentAddress", { ...perm, state: v })}>
              <SelectTrigger className="clay-input"><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {STATES_INDIA.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="PIN Code" required error={undefined}>
            <Input value={perm.pinCode || ""} onChange={(e) => set("permanentAddress", { ...perm, pinCode: e.target.value })} className="clay-input" maxLength={6} />
          </Field>
        </FieldGroup>
      )}

      <FieldGroup title="Transport" subtitle="Conditional — Bus Route/Stop appear if opted">
        <div className="sm:col-span-2 flex items-center gap-2">
          <Switch checked={data.optedForTransport || false} onCheckedChange={(v) => set("optedForTransport", v)} />
          <span className="text-sm">Opted for Transport</span>
        </div>
        {data.optedForTransport && (
          <>
            <Field label="Bus Route" required error={errors.busRoute}>
              <Input value={data.busRoute || ""} onChange={(e) => set("busRoute", e.target.value)} className="clay-input" maxLength={120} />
            </Field>
            <Field label="Bus Stop" required error={errors.busStop}>
              <Input value={data.busStop || ""} onChange={(e) => set("busStop", e.target.value)} className="clay-input" maxLength={120} />
            </Field>
          </>
        )}
      </FieldGroup>
    </div>
  );
}

// ─── Tab 3: Professional ─────────────────────────────────────────────────────

function Tab3Professional({
  data, set, errors,
}: {
  data: Partial<StaffFormData>;
  set: (k: string, v: unknown) => void;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <div className="space-y-6">
      <FieldGroup title="Appointment">
        <Field label="Area of Specialization" error={undefined}>
          <Input value={data.areaOfSpecialization || ""} onChange={(e) => set("areaOfSpecialization", e.target.value)} className="clay-input" placeholder="e.g. Mathematics, Hindi Literature" maxLength={120} />
        </Field>
        <Field label="Employment Type" error={undefined}>
          <Select value={data.employmentType || ""} onValueChange={(v) => set("employmentType", v)}>
            <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date of Joining" required error={errors.dateOfJoining}>
          <Input type="date" value={data.dateOfJoining || ""} onChange={(e) => set("dateOfJoining", e.target.value)} className="clay-input" />
        </Field>
      </FieldGroup>
    </div>
  );
}

// ─── Tab 4: Education & Qualifications ───────────────────────────────────────

function Tab4Education({
  data, set, errors,
}: {
  data: Partial<StaffFormData>;
  set: (k: string, v: unknown) => void;
  errors: Partial<Record<string, string>>;
}) {
  const education: any[] = (data as any).education || [];
  const certifications: any[] = (data as any).certifications || [];

  const addEdu = () => set("education", [...education, { level: [], yearOfPassing: "", degreeName: "", subject: "", institution: "", boardUniversity: "", state: "", percentageOrCgpa: undefined, medium: undefined, certificateUrl: "" }]);
  const updateEdu = (i: number, v: any) => {
    const next = [...education]; next[i] = v; set("education", next);
  };
  const removeEdu = (i: number) => set("education", education.filter((_: any, j: number) => j !== i));

  const addCert = () => set("certifications", [...certifications, { subjectSkillName: "", courseName: "", institute: "", duration: "", haveCertificate: false, certificateUrl: "" }]);
  const updateCert = (i: number, v: any) => {
    const next = [...certifications]; next[i] = v; set("certifications", next);
  };
  const removeCert = (i: number) => set("certifications", certifications.filter((_: any, j: number) => j !== i));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Academic Qualifications</p>
        <p className="text-xs text-muted-foreground mb-3">Min 1 row required. Max 10.</p>
        {education.length < 10 && (
          <Button variant="outline" size="sm" onClick={addEdu} className="mb-3 cursor-pointer"><Plus className="h-4 w-4 mr-1.5" /> Add Qualification</Button>
        )}
        <div className="space-y-3">
          {education.map((e, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Badge variant="outline">#{i + 1}</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeEdu(i)} className="text-destructive cursor-pointer"><Trash2 className="h-3 w-3" /></Button>
              </div>
              <FieldGroup title="Level (multi-select)">
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  {QUALIFICATION_LEVELS.map((lvl) => {
                    const checked = (e.level || []).includes(lvl);
                    return (
                      <label key={lvl} className={cn(
                        "px-2.5 py-1 rounded-full text-xs border cursor-pointer transition-colors flex items-center gap-1",
                        checked ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary",
                      )}>
                        <Checkbox checked={checked} onCheckedChange={(c) => {
                          const cur = e.level || [];
                          updateEdu(i, { ...e, level: c ? [...cur, lvl] : cur.filter((x: string) => x !== lvl) });
                        }} />
                        {lvl}
                      </label>
                    );
                  })}
                </div>
              </FieldGroup>
              <FieldGroup title="Details">
                <Field label="Year of Passing" required>
                  <Input type="number" min={1950} max={new Date().getFullYear()} value={e.yearOfPassing || ""} onChange={(ev) => updateEdu(i, { ...e, yearOfPassing: ev.target.value })} className="clay-input" placeholder="2020" />
                </Field>
                <Field label="Degree / Certificate Name" required>
                  <Input value={e.degreeName || ""} onChange={(ev) => updateEdu(i, { ...e, degreeName: ev.target.value })} className="clay-input" placeholder="e.g. M.Sc." />
                </Field>
                <Field label="Subject / Specialization" required>
                  <Input value={e.subject || ""} onChange={(ev) => updateEdu(i, { ...e, subject: ev.target.value })} className="clay-input" />
                </Field>
                <Field label="School / College / University" required>
                  <Input value={e.institution || ""} onChange={(ev) => updateEdu(i, { ...e, institution: ev.target.value })} className="clay-input" />
                </Field>
                <Field label="Board / University" required>
                  <Input value={e.boardUniversity || ""} onChange={(ev) => updateEdu(i, { ...e, boardUniversity: ev.target.value })} className="clay-input" placeholder="e.g. CBSE, University of Delhi" />
                </Field>
                <Field label="State (Institution)">
                  <Select value={e.state || ""} onValueChange={(v) => updateEdu(i, { ...e, state: v })}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {STATES_INDIA.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Percentage / CGPA">
                  <Input type="number" step="0.01" value={e.percentageOrCgpa ?? ""} onChange={(ev) => updateEdu(i, { ...e, percentageOrCgpa: ev.target.value ? parseFloat(ev.target.value) : undefined })} className="clay-input" placeholder="0-100 or 0-10" />
                </Field>
                <Field label="Medium of Instruction">
                  <Select value={e.medium || ""} onValueChange={(v) => updateEdu(i, { ...e, medium: v })}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Hindi", "English", "Other"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Certificate (URL)">
                  <Input value={e.certificateUrl || ""} onChange={(ev) => updateEdu(i, { ...e, certificateUrl: ev.target.value })} className="clay-input" placeholder="https://..." />
                </Field>
              </FieldGroup>
            </div>
          ))}
        </div>
        {errors.education && <p className="text-xs text-destructive mt-2">{errors.education}</p>}
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vocational / Certification Courses</p>
        <p className="text-xs text-muted-foreground mb-3">Optional. Max 10.</p>
        {certifications.length < 10 && (
          <Button variant="outline" size="sm" onClick={addCert} className="mb-3 cursor-pointer"><Plus className="h-4 w-4 mr-1.5" /> Add Course</Button>
        )}
        <div className="space-y-3">
          {certifications.map((c, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Badge variant="outline">#{i + 1}</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeCert(i)} className="text-destructive cursor-pointer"><Trash2 className="h-3 w-3" /></Button>
              </div>
              <FieldGroup title="Course">
                <Field label="Subject / Skill" required>
                  <Input value={c.subjectSkillName || ""} onChange={(ev) => updateCert(i, { ...c, subjectSkillName: ev.target.value })} className="clay-input" />
                </Field>
                <Field label="Course Name" required>
                  <Input value={c.courseName || ""} onChange={(ev) => updateCert(i, { ...c, courseName: ev.target.value })} className="clay-input" />
                </Field>
                <Field label="Institute / Certifier" required>
                  <Input value={c.institute || ""} onChange={(ev) => updateCert(i, { ...c, institute: ev.target.value })} className="clay-input" />
                </Field>
                <Field label="Duration">
                  <Input value={c.duration || ""} onChange={(ev) => updateCert(i, { ...c, duration: ev.target.value })} className="clay-input" placeholder="e.g. 6 months" />
                </Field>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Switch checked={c.haveCertificate || false} onCheckedChange={(v) => updateCert(i, { ...c, haveCertificate: v })} />
                  <span className="text-sm">Have Certificate</span>
                </div>
                {c.haveCertificate && (
                  <Field label="Certificate URL">
                    <Input value={c.certificateUrl || ""} onChange={(ev) => updateCert(i, { ...c, certificateUrl: ev.target.value })} className="clay-input" />
                  </Field>
                )}
              </FieldGroup>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 5: Experience ───────────────────────────────────────────────────────

function Tab5Experience({
  data, set, errors,
}: {
  data: Partial<StaffFormData>;
  set: (k: string, v: unknown) => void;
  errors: Partial<Record<string, string>>;
}) {
  const experience: any[] = (data as any).experience || [];

  const addExp = () => set("experience", [...experience, { organization: "", fromYear: new Date().getFullYear(), postHeld: "" }]);
  const updateExp = (i: number, v: any) => {
    const next = [...experience]; next[i] = v; set("experience", next);
  };
  const removeExp = (i: number) => set("experience", experience.filter((_: any, j: number) => j !== i));

  // Summary
  const summary = (() => {
    let total = 0;
    for (const e of experience) {
      if (!e.fromYear) continue;
      const to = e.toYear === "Present" || !e.toYear ? new Date().getFullYear() : parseInt(String(e.toYear));
      const from = parseInt(String(e.fromYear));
      if (!isNaN(from) && !isNaN(to) && to >= from) total += to - from;
    }
    return total;
  })();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Work Experience</p>
        <p className="text-xs text-muted-foreground mb-3">Min 1 row required (use "Fresher / First Job" if none). Max 20.</p>
        {summary > 0 && (
          <div className="mb-3 px-3 py-2 bg-muted rounded-lg text-sm">
            Total Experience: <span className="font-semibold">{summary} years</span>
          </div>
        )}
        {experience.length < 20 && (
          <Button variant="outline" size="sm" onClick={addExp} className="mb-3 cursor-pointer"><Plus className="h-4 w-4 mr-1.5" /> Add Experience</Button>
        )}
        <div className="space-y-3">
          {experience.map((e, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Badge variant="outline">#{i + 1}</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeExp(i)} className="text-destructive cursor-pointer"><Trash2 className="h-3 w-3" /></Button>
              </div>
              <FieldGroup title="Job">
                <Field label="School / Organization" required>
                  <Input value={e.organization || ""} onChange={(ev) => updateExp(i, { ...e, organization: ev.target.value })} className="clay-input" />
                </Field>
                <Field label="Post Held" required>
                  <Input value={e.postHeld || ""} onChange={(ev) => updateExp(i, { ...e, postHeld: ev.target.value })} className="clay-input" placeholder="e.g. TGT Mathematics" />
                </Field>
                <Field label="From Year" required>
                  <Input type="number" min={1980} max={new Date().getFullYear()} value={e.fromYear ?? ""} onChange={(ev) => updateExp(i, { ...e, fromYear: ev.target.value ? parseInt(ev.target.value) : undefined })} className="clay-input" />
                </Field>
                <Field label="To Year (or Present)">
                  <Input value={e.toYear ?? ""} onChange={(ev) => updateExp(i, { ...e, toYear: ev.target.value })} className="clay-input" placeholder="YYYY or 'Present'" />
                </Field>
                <Field label="Working Hours / Week">
                  <Input type="number" min={1} max={80} value={e.workingHoursPerWeek ?? ""} onChange={(ev) => updateExp(i, { ...e, workingHoursPerWeek: ev.target.value ? parseInt(ev.target.value) : undefined })} className="clay-input" />
                </Field>
                <Field label="Board / Type">
                  <Select value={e.boardType || ""} onValueChange={(v) => updateExp(i, { ...e, boardType: v })}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {BOARD_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Classes Taught">
                  <Input value={e.classesTaught || ""} onChange={(ev) => updateExp(i, { ...e, classesTaught: ev.target.value })} className="clay-input" placeholder="e.g. Class 6 – 10" />
                </Field>
                <Field label="Subject(s) Taught">
                  <Input value={e.subjectsTaught || ""} onChange={(ev) => updateExp(i, { ...e, subjectsTaught: ev.target.value })} className="clay-input" />
                </Field>
                <Field label="Reason for Leaving" className="sm:col-span-2">
                  <Textarea value={e.reasonForLeaving || ""} onChange={(ev) => updateExp(i, { ...e, reasonForLeaving: ev.target.value })} className="clay-input" maxLength={500} />
                </Field>
              </FieldGroup>
            </div>
          ))}
        </div>
        {errors.experience && <p className="text-xs text-destructive mt-2">{errors.experience}</p>}
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Administrative & Other Experience</p>
        <div className="space-y-3">
          <Field label="Brief Note on Administrative Experience" error={undefined}>
            <Textarea value={(data as any).adminExperienceNote || ""} onChange={(e) => set("adminExperienceNote", e.target.value)} className="clay-input" maxLength={500} />
          </Field>
          <Field label="Assignments / Responsibilities (Non-Teaching)" error={undefined}>
            <Textarea value={(data as any).assignmentsResponsibilities || ""} onChange={(e) => set("assignmentsResponsibilities", e.target.value)} className="clay-input" maxLength={500} />
          </Field>
          <Field label="Courses / Studies Currently Pursuing" error={undefined}>
            <Textarea value={(data as any).coursesCurrentlyPursuing || ""} onChange={(e) => set("coursesCurrentlyPursuing", e.target.value)} className="clay-input" maxLength={500} />
          </Field>
          {(data as any).coursesCurrentlyPursuing && (
            <div className="flex items-center gap-2">
              <Switch checked={(data as any).leaveRequiredStudies || false} onCheckedChange={(v) => set("leaveRequiredStudies", v)} />
              <span className="text-sm">Will you need leave on this account?</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 6: Payroll ──────────────────────────────────────────────────────────

function Tab6Payroll({
  data, set, errors,
}: {
  data: Partial<StaffFormData>;
  set: (k: string, v: unknown) => void;
  errors: Partial<Record<string, string>>;
}) {
  const basic = (data as any).basicSalary ?? 0;
  const hra = (data as any).hra ?? 0;
  const da = (data as any).da ?? 0;
  const special = (data as any).specialAllowance ?? 0;
  const other = (data as any).otherAllowance ?? 0;
  const computedGross = Number(basic || 0) + Number(hra || 0) + Number(da || 0) + Number(special || 0) + Number(other || 0);

  return (
    <div className="space-y-6">
      <FieldGroup title="Salary Structure">
        <Field label="Pay Scale / Grade" error={undefined}>
          <Input value={(data as any).payScaleGrade || ""} onChange={(e) => set("payScaleGrade", e.target.value)} className="clay-input" placeholder="e.g. Grade A" />
        </Field>
        <Field label="Basic Salary (₹/month)" required>
          <Input type="number" min={0} value={basic || ""} onChange={(e) => set("basicSalary", e.target.value ? parseFloat(e.target.value) : 0)} className="clay-input" />
        </Field>
        <Field label="HRA (₹/month)">
          <Input type="number" min={0} value={hra || ""} onChange={(e) => set("hra", e.target.value ? parseFloat(e.target.value) : 0)} className="clay-input" />
        </Field>
        <Field label="DA (₹/month)">
          <Input type="number" min={0} value={da || ""} onChange={(e) => set("da", e.target.value ? parseFloat(e.target.value) : 0)} className="clay-input" />
        </Field>
        <Field label="Special Allowance (₹/month)">
          <Input type="number" min={0} value={special || ""} onChange={(e) => set("specialAllowance", e.target.value ? parseFloat(e.target.value) : 0)} className="clay-input" />
        </Field>
        <Field label="Other Allowance (₹/month)">
          <Input type="number" min={0} value={other || ""} onChange={(e) => set("otherAllowance", e.target.value ? parseFloat(e.target.value) : 0)} className="clay-input" />
        </Field>
        <Field label="Gross Salary (₹/month) — auto-computed" error={undefined}>
          <Input type="number" min={0} value={computedGross} onChange={(e) => set("grossSalary", e.target.value ? parseFloat(e.target.value) : 0)} className="clay-input" />
        </Field>
      </FieldGroup>

      <FieldGroup title="Previous Employer">
        <Field label="Last Salary Drawn (₹/month)">
          <Input type="number" min={0} value={(data as any).lastSalaryDrawn ?? ""} onChange={(e) => set("lastSalaryDrawn", e.target.value ? parseFloat(e.target.value) : undefined)} className="clay-input" />
        </Field>
        <Field label="Last Salary Year">
          <Input type="number" min={1980} max={new Date().getFullYear()} value={(data as any).lastSalaryYear ?? ""} onChange={(e) => set("lastSalaryYear", e.target.value ? parseInt(e.target.value) : undefined)} className="clay-input" />
        </Field>
        <Field label="Mode of Last Salary Payment">
          <Select value={(data as any).modeOfLastSalaryPayment || ""} onValueChange={(v) => set("modeOfLastSalaryPayment", v)}>
            <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Bank">Bank</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {(data as any).lastSalaryDrawn > 0 && (
          <Field label="Salary Certificate URL" required error={errors.salaryCertificateUrl}>
            <Input value={(data as any).salaryCertificateUrl || ""} onChange={(e) => set("salaryCertificateUrl", e.target.value)} className="clay-input" />
          </Field>
        )}
      </FieldGroup>

      <FieldGroup title="Applicant Declarations">
        <Field label="Minimum Expected Salary (₹)">
          <Input type="number" min={0} value={(data as any).minimumExpectedSalary ?? ""} onChange={(e) => set("minimumExpectedSalary", e.target.value ? parseFloat(e.target.value) : undefined)} className="clay-input" />
        </Field>
        <Field label="Date of Last Increment">
          <Input type="date" value={(data as any).dateOfLastIncrement || ""} onChange={(e) => set("dateOfLastIncrement", e.target.value)} className="clay-input" />
        </Field>
        <Field label="If Selected, Date of Joining Will Be">
          <Input type="date" value={(data as any).ifSelectedJoiningDate || ""} onChange={(e) => set("ifSelectedJoiningDate", e.target.value)} className="clay-input" />
        </Field>
      </FieldGroup>
    </div>
  );
}

// ─── Tab 7: Statutory & Records ──────────────────────────────────────────────

function Tab7Statutory({
  data, set, errors,
}: {
  data: Partial<StaffFormData>;
  set: (k: string, v: unknown) => void;
  errors: Partial<Record<string, string>>;
}) {
  const references: any[] = (data as any).references || [];
  const showMinorityDetails = !!data.minority;
  const showDisabilityCert = data.disabilityType && data.disabilityType !== "None";
  const showEpfFields = data.epfEnrolled;

  const addRef = () => set("references", [...references, { name: "", designationRelation: "", address: "", telMobile: "" }]);
  const updateRef = (i: number, v: any) => {
    const next = [...references]; next[i] = v; set("references", next);
  };
  const removeRef = (i: number) => set("references", references.filter((_: any, j: number) => j !== i));

  return (
    <div className="space-y-6">
      <FieldGroup title="Bank Details">
        <Field label="Bank Account Number" error={errors.bankAccountNumber}>
          <Input value={(data as any).bankAccountNumber || ""} onChange={(e) => set("bankAccountNumber", e.target.value)} className="clay-input" maxLength={40} />
        </Field>
        <Field label="IFSC Code" error={errors.ifscCode}>
          <Input value={(data as any).ifscCode || ""} onChange={(e) => set("ifscCode", e.target.value.toUpperCase())} className="clay-input" placeholder="e.g. SBIN0001234" maxLength={11} />
        </Field>
        <Field label="Bank Name" error={undefined}>
          <Input value={data.bankName || ""} onChange={(e) => set("bankName", e.target.value)} className="clay-input" />
        </Field>
        <Field label="Bank Branch" error={undefined}>
          <Input value={(data as any).bankBranch || ""} onChange={(e) => set("bankBranch", e.target.value)} className="clay-input" />
        </Field>
        <Field label="Bank Passbook / Cancelled Cheque URL" error={undefined} className="sm:col-span-2">
          <Input value={(data as any).bankPassbookUrl || ""} onChange={(e) => set("bankPassbookUrl", e.target.value)} className="clay-input" />
        </Field>
      </FieldGroup>

      <FieldGroup title="Statutory IDs">
        <Field label="PAN Number" error={errors.panNumber}>
          <Input value={data.panNumber || ""} onChange={(e) => set("panNumber", e.target.value.toUpperCase())} className="clay-input" placeholder="e.g. AABBT1234E" maxLength={10} />
        </Field>
        <Field label="PAN Card URL" error={undefined}>
          <Input value={(data as any).panCardUrl || ""} onChange={(e) => set("panCardUrl", e.target.value)} className="clay-input" />
        </Field>
        <Field label="Aadhar Number" error={errors.aadharNumber}>
          <Input
            value={data.aadharNumber || ""}
            onChange={(e) => set("aadharNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
            disabled={data.aadharNotAvailable}
            className="clay-input"
            placeholder="12-digit Aadhar"
            maxLength={12}
          />
        </Field>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Switch checked={data.aadharNotAvailable || false} onCheckedChange={(v) => set("aadharNotAvailable", v)} />
          <span className="text-sm">Aadhar Not Available</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={data.epfEnrolled || false} onCheckedChange={(v) => set("epfEnrolled", v)} />
          <span className="text-sm">EPF / ESI Enrolled</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={data.gratuityEligible || false} onCheckedChange={(v) => set("gratuityEligible", v)} />
          <span className="text-sm">Gratuity Eligible</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={data.tdsApplicable || false} onCheckedChange={(v) => set("tdsApplicable", v)} />
          <span className="text-sm">TDS Applicable</span>
        </div>
        {showEpfFields && (
          <>
            <Field label="EPF / UAN Number" required error={errors.epfUan}>
              <Input value={data.epfUan || ""} onChange={(e) => set("epfUan", e.target.value)} className="clay-input" maxLength={40} />
            </Field>
            <Field label="ESI Number" required error={errors.esicNumber}>
              <Input value={data.esicNumber || ""} onChange={(e) => set("esicNumber", e.target.value)} className="clay-input" maxLength={40} />
            </Field>
          </>
        )}
      </FieldGroup>

      <FieldGroup title="Disability">
        <Field label="Disability Type" error={undefined}>
          <Select value={data.disabilityType || "None"} onValueChange={(v) => set("disabilityType", v)}>
            <SelectTrigger className="clay-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["None", "Locomotor", "Visual", "Hearing", "Other"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {data.disabilityType === "Other" && (
          <Field label="Disability Specification" required error={errors.disabilitySpecification}>
            <Input value={(data as any).disabilitySpecification || ""} onChange={(e) => set("disabilitySpecification", e.target.value)} className="clay-input" maxLength={200} />
          </Field>
        )}
        {showDisabilityCert && (
          <>
            <Field label="Disability Percentage" required error={errors.disabilityPercentage}>
              <Input type="number" min={0} max={100} value={(data as any).disabilityPercentage ?? ""} onChange={(e) => set("disabilityPercentage", e.target.value ? parseFloat(e.target.value) : undefined)} className="clay-input" />
            </Field>
            <Field label="Disability Certificate URL" error={undefined}>
              <Input value={(data as any).disabilityCertificateUrl || ""} onChange={(e) => set("disabilityCertificateUrl", e.target.value)} className="clay-input" />
            </Field>
          </>
        )}
      </FieldGroup>

      {showMinorityDetails && (
        <FieldGroup title="Minority Details">
          <div className="flex items-center gap-2">
            <Switch checked={(data as any).minorityCertificateReceived || false} onCheckedChange={(v) => set("minorityCertificateReceived", v)} />
            <span className="text-sm">Minority Certificate Received</span>
          </div>
          <Field label="Minority Certificate URL" error={undefined}>
            <Input value={(data as any).minorityCertificateUrl || ""} onChange={(e) => set("minorityCertificateUrl", e.target.value)} className="clay-input" />
          </Field>
        </FieldGroup>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">References</p>
        <p className="text-xs text-muted-foreground mb-3">Min 2 rows required. Max 5.</p>
        {references.length < 5 && (
          <Button variant="outline" size="sm" onClick={addRef} className="mb-3 cursor-pointer"><Plus className="h-4 w-4 mr-1.5" /> Add Reference</Button>
        )}
        <div className="space-y-3">
          {references.map((r, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Badge variant="outline">#{i + 1}</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeRef(i)} className="text-destructive cursor-pointer"><Trash2 className="h-3 w-3" /></Button>
              </div>
              <FieldGroup title="Reference">
                <Field label="Name" required>
                  <Input value={r.name || ""} onChange={(ev) => updateRef(i, { ...r, name: ev.target.value })} className="clay-input" />
                </Field>
                <Field label="Designation / Relation" required>
                  <Input value={r.designationRelation || ""} onChange={(ev) => updateRef(i, { ...r, designationRelation: ev.target.value })} className="clay-input" placeholder="e.g. Principal, ABC School" />
                </Field>
                <Field label="Address" required className="sm:col-span-2">
                  <Input value={r.address || ""} onChange={(ev) => updateRef(i, { ...r, address: ev.target.value })} className="clay-input" />
                </Field>
                <Field label="Tel / Mobile" required>
                  <Input type="tel" value={r.telMobile || ""} onChange={(ev) => updateRef(i, { ...r, telMobile: ev.target.value })} className="clay-input" placeholder="10-digit mobile" maxLength={10} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={r.email || ""} onChange={(ev) => updateRef(i, { ...r, email: ev.target.value })} className="clay-input" />
                </Field>
              </FieldGroup>
            </div>
          ))}
        </div>
        {errors.references && <p className="text-xs text-destructive mt-2">{errors.references}</p>}
      </div>
    </div>
  );
}

// ─── Main StaffForm component ─────────────────────────────────────────────────

export function StaffForm({
  schoolId, initialData, onSave, onCancel, isEditing,
  currentTab, onTabChange, staffProfileId: staffProfileIdProp,
  mode = "edit", onAbandon, onIdentityChange,
}: StaffFormProps) {
  const [internalTab, setInternalTab] = useState<StaffTabId>("tab1");
  const activeTab = currentTab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;
  const [staffId, setStaffId] = useState<string | undefined>(initialData?.employeeId);
  const [staffProfileId, setStaffProfileId] = useState<string | undefined>(staffProfileIdProp ?? (initialData as any)?.profileId);
  const [coreLocked, setCoreLocked] = useState(!!initialData?.employeeId);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [data, setData] = useState<Partial<StaffFormData>>(() => ({
    nationality: "Indian",
    sameAsLocalAddress: true,
    yearOfJoining: new Date().getFullYear(),
    languages: [],
    children: [],
    education: [],
    certifications: [],
    experience: [],
    references: [],
    localAddress: {},
    permanentAddress: {},
    ...(initialData as any),
  }));

  // Reset when initialData changes (overlay switches staff)
  const initialDataRef = useRef(initialData);
  if (initialData !== initialDataRef.current) {
    initialDataRef.current = initialData;
    setInternalTab("tab1");
    setStaffId(initialData?.employeeId);
    setStaffProfileId(staffProfileIdProp ?? (initialData as any)?.profileId);
    setCoreLocked(!!initialData?.employeeId);
    setData({
      nationality: "Indian",
      sameAsLocalAddress: true,
      yearOfJoining: new Date().getFullYear(),
      languages: [],
      children: [],
      education: [],
      certifications: [],
      experience: [],
      references: [],
      localAddress: {},
      permanentAddress: {},
      ...(initialData as any),
    });
    setErrors({});
  }

  const set = useCallback((k: string, v: unknown) => {
    setData((prev) => ({ ...prev, [k]: v }));
  }, []);

  // Tab 1 is locked in create mode until the edge function returns a Staff ID.
  // Once staffId is set, all 7 tabs become navigable.
  const isCreateLocked = mode === "create" && !staffId;

  // Bubble Tab 1 identity fields up to the parent so a persistent header can render them
  // on every tab. Re-fires on every data change — parent should keep this cheap.
  useEffect(() => {
    if (!onIdentityChange) return;
    onIdentityChange({
      employeeId: staffId,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      fatherFirstName: data.fatherFirstName,
      fatherMiddleName: data.fatherMiddleName,
      fatherLastName: data.fatherLastName,
    });
    // We intentionally only re-fire when one of the identity fields changes; staffId is
    // captured via the data state path (and we re-fire when it changes).
  }, [
    onIdentityChange,
    staffId,
    data.firstName, data.middleName, data.lastName,
    data.fatherFirstName, data.fatherMiddleName, data.fatherLastName,
  ]);

  const { run: runGuarded, isPending: isGuarded } = useGuardedSubmit();
  const idempotencyKeyRef = useRef<string | null>(null);

  const handleTab1Submit = () => {
    // Validate Tab 1 (identity + login)
    const errs: Record<string, string> = {};
    if (!data.firstName?.trim()) errs.firstName = "First name required";
    if (!data.lastName?.trim()) errs.lastName = "Last name required";
    if (!data.fatherFirstName?.trim()) errs.fatherFirstName = "Father first name required";
    if (!data.fatherLastName?.trim()) errs.fatherLastName = "Father last name required";
    if (!data.gender) errs.gender = "Gender required";
    if (!data.loginMobile?.match(/^\d{10}$/)) errs.loginMobile = "Enter 10-digit mobile";
    if (!data.yearOfJoining) errs.yearOfJoining = "Year of joining required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast({ title: "Please fix the errors", variant: "destructive" });
      return;
    }

    if (!staffId) {
      void runGuarded(async () => {
        try {
          if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
          const yearForId = data.yearOfJoining ?? new Date().getFullYear();
          const nameParts = [data.firstName, data.middleName, data.lastName].filter(Boolean) as string[];
          const fullName = nameParts.join(" ");
          const salutation = data.gender === "Male" ? "Mr." : data.gender === "Female" ? "Mrs." : data.gender === "Other" ? "Ms." : null;

          const result = await createStaffAuthUser({
            schoolId,
            loginMobile: data.loginMobile ?? "",
            fullName,
            role: (data as any).role ?? "teacher",
            year: yearForId,
            fatherFirstName: data.fatherFirstName,
            fatherMiddleName: data.fatherMiddleName,
            fatherLastName: data.fatherLastName,
            gender: data.gender,
            dob: (data as any).dateOfBirth,
            salutation: salutation ?? undefined,
            idempotencyKey: idempotencyKeyRef.current,
          });

          if (!result) {
            toast({ title: "Staff ID creation failed", description: "Edge Function did not return a result.", variant: "destructive" });
            return;
          }

          setStaffId(result.employeeId);
          setStaffProfileId(result.staffProfileId);
          setCoreLocked(true);
          idempotencyKeyRef.current = null;

          toast({ title: "Staff ID created", description: `${result.employeeId} — staff is now in directory.` });
          setActiveTab("tab2");
        } catch (err: any) {
          toast({ title: "Staff ID creation failed", description: err?.message ?? "Please try again.", variant: "destructive" });
        }
      });
    } else {
      // Already have Staff_ID — advance
      setActiveTab("tab2");
    }
  };

  const handleSaveTab = async (tab: StaffTabId) => {
    if (!staffProfileId) {
      toast({ title: "Save Staff ID first", description: "Complete Tab 1 to generate Staff ID.", variant: "destructive" });
      setActiveTab("tab1");
      return;
    }
    setSaving(true);
    try {
      const result = await updateStaffProfilePartial(staffProfileId, tab, data as any);
      if (result.success) {
        toast({ title: `${STAFF_TABS.find((t) => t.id === tab)?.label} saved` });
      } else {
        toast({ title: "Save failed", description: result.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalSave = async () => {
    if (!staffProfileId) {
      toast({ title: "Save Staff ID first", variant: "destructive" });
      setActiveTab("tab1");
      return;
    }
    setSaving(true);
    try {
      const result = await updateStaffProfileFull(staffProfileId, data as any);
      if (!result.success) {
        toast({ title: "Save failed", description: result.error, variant: "destructive" });
        return;
      }
      await onSave({
        ...data,
        employeeId: staffId,
        profileId: staffProfileId,
      } as StaffFormData);
      toast({ title: isEditing ? "Staff updated" : "Staff profile completed", description: staffId ? `${staffId} — all sections saved.` : "" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUnlockConfirm = () => {
    setCoreLocked(false);
    setUnlockDialogOpen(false);
  };

  const isTab1 = activeTab === "tab1";
  const isLastTab = activeTab === "tab7";

  // Guard: in create-locked mode, snap any tab change back to tab1.
  const handleTabChange = (v: string) => {
    if (isCreateLocked && v !== "tab1") {
      toast({ title: "Complete Tab 1 to unlock other tabs", variant: "destructive" });
      return;
    }
    setActiveTab(v as StaffTabId);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Desktop: tab strip. Mobile: dropdown picker. */}
        <div className="hidden md:block overflow-x-auto -mx-2 px-2">
          <TabsList className="inline-flex h-auto min-w-full">
            {STAFF_TABS.map((t) => {
              const locked = isCreateLocked && t.id !== "tab1";
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  disabled={locked}
                  className={cn(
                    "whitespace-nowrap min-h-[44px]",
                    locked ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  )}
                  title={locked ? "Complete Tab 1 to unlock" : undefined}
                >
                  {locked && <Lock className="h-3 w-3 mr-1 inline" />}
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        <div className="md:hidden">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="clay-input w-full min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAFF_TABS.map((t, i) => {
                const locked = isCreateLocked && t.id !== "tab1";
                return (
                  <SelectItem key={t.id} value={t.id} disabled={locked} className={locked ? "opacity-50" : ""}>
                    {locked && <Lock className="h-3 w-3 mr-1 inline" />}
                    {i + 1}. {t.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="tab1" className="mt-6">
          <Tab1Identity data={data} set={set} errors={errors} staffId={staffId} locked={coreLocked} onUnlockRequest={() => setUnlockDialogOpen(true)} />
        </TabsContent>
        <TabsContent value="tab2" className="mt-6">
          <Tab2PersonalContact data={data} set={set} errors={errors} />
        </TabsContent>
        <TabsContent value="tab3" className="mt-6">
          <Tab3Professional data={data} set={set} errors={errors} />
        </TabsContent>
        <TabsContent value="tab4" className="mt-6">
          <Tab4Education data={data} set={set} errors={errors} />
        </TabsContent>
        <TabsContent value="tab5" className="mt-6">
          <Tab5Experience data={data} set={set} errors={errors} />
        </TabsContent>
        <TabsContent value="tab6" className="mt-6">
          <Tab6Payroll data={data} set={set} errors={errors} />
        </TabsContent>
        <TabsContent value="tab7" className="mt-6">
          <Tab7Statutory data={data} set={set} errors={errors} />
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="outline"
          onClick={isTab1
            ? (isCreateLocked ? onAbandon : onCancel)
            : () => {
                const idx = STAFF_TABS.findIndex((t) => t.id === activeTab);
                if (idx > 0) setActiveTab(STAFF_TABS[idx - 1].id);
              }}
          className="cursor-pointer"
        >
          {isTab1
            ? (isCreateLocked ? "Abandon" : "Cancel")
            : <><ChevronLeft className="h-4 w-4 mr-1" /> Back</>}
        </Button>
        <div className="flex gap-2 flex-wrap">
          {!isTab1 && (
            <Button variant="outline" onClick={() => handleSaveTab(activeTab)} disabled={saving} className="cursor-pointer">
              <Save className="h-4 w-4 mr-1" /> Save as Draft
            </Button>
          )}
          {isTab1 ? (
            <SubmitButton onClick={handleTab1Submit} loadingLabel="Creating Staff ID…" className="clay-btn clay-btn-primary cursor-pointer">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </SubmitButton>
          ) : isLastTab ? (
            <Button onClick={handleFinalSave} disabled={saving} className="clay-btn clay-btn-primary cursor-pointer">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              {isEditing ? "Save Changes" : "Save Staff"}
            </Button>
          ) : (
            <Button onClick={() => {
              const idx = STAFF_TABS.findIndex((t) => t.id === activeTab);
              if (idx < STAFF_TABS.length - 1) setActiveTab(STAFF_TABS[idx + 1].id);
            }} className="clay-btn clay-btn-primary cursor-pointer">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Core Identity?</DialogTitle>
            <DialogDescription>
              Core identity fields are locked after Staff ID creation. Unlocking will allow you to edit them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockDialogOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleUnlockConfirm} className="cursor-pointer">Unlock & Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
