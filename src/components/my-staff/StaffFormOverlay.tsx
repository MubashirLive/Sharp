import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, X, Home, CalendarDays, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StaffForm, STAFF_TABS } from "@/components/staff/StaffForm";
import type { StaffTabId, StaffFormIdentity } from "@/components/staff/StaffForm";
import type { StaffWithDetails } from "@/integrations/supabase/queries/staff";
import type { StaffFormData } from "@/lib/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { useMessengerPanel } from "@/contexts/MessengerContext";

export type StaffFormOverlayMode = 'view' | 'edit' | 'create';

interface StaffFormOverlayProps {
  staff?: StaffWithDetails;
  schoolId: string;
  onClose: () => void;
  onSave: (data: Partial<StaffWithDetails>) => Promise<void>;
  mode?: StaffFormOverlayMode;
  /** Optional: when provided (in view mode), a "Delete" button appears in the footer. */
  onDelete?: (staff: StaffWithDetails) => void;
  /** Caller role to gate the delete button (Principal/Master Admin only). */
  canDelete?: boolean;
}

// Read-only section display
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

const TAB_IDS: StaffTabId[] = STAFF_TABS.map((t) => t.id);

function joinName(...parts: Array<string | undefined | null>): string {
  return parts.filter(Boolean).join(" ").trim();
}

function initialIdentityFromStaff(staff?: StaffWithDetails): StaffFormIdentity {
  if (!staff) return {};
  return {
    employeeId: staff.employee_id ?? undefined,
    firstName: undefined, // populated by the form once it renders
    middleName: undefined,
    lastName: undefined,
    fatherFirstName: staff.father_first_name ?? undefined,
    fatherMiddleName: staff.father_middle_name ?? undefined,
    fatherLastName: staff.father_last_name ?? undefined,
  };
}

// Convert StaffWithDetails (DB) → StaffFormData (form) — 7-tab schema
function staffToFormData(staff: StaffWithDetails): Partial<StaffFormData> {
  const nameParts = (staff.full_name ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : undefined;

  // Existing local/permanent address stored as plain text — pack into address object
  const localAddress = {
    line1: staff.local_address ?? "",
    cityVillage: "",
    district: "",
    state: "",
    pinCode: "",
  } as any;
  const permanentAddress = staff.permanent_address
    ? { line1: staff.permanent_address } as any
    : undefined;

  return {
    // Tab 1
    firstName,
    middleName,
    lastName,
    fatherFirstName: staff.father_first_name,
    fatherMiddleName: staff.father_middle_name,
    fatherLastName: staff.father_last_name,
    gender: staff.gender as "Male" | "Female" | "Other",
    loginMobile: staff.login_mobile ?? "",
    yearOfJoining: staff.joining_date ? new Date(staff.joining_date).getFullYear() : new Date().getFullYear(),

    // Tab 2
    dateOfBirth: staff.dob ?? undefined,
    personalEmail: staff.personal_email ?? "",
    whatsappMobile: staff.whatsapp_mobile as any,
    emergencyContactName: staff.emergency_contact_name ?? undefined,
    emergencyContactNumber: staff.emergency_contact_number as any,
    emergencyContactRelation: staff.emergency_contact_relation ?? undefined,
    bloodGroup: staff.blood_group as any,
    localAddress,
    sameAsLocalAddress: !staff.permanent_address,
    permanentAddress,
    nationality: "Indian",
    languages: [],
    children: [],

    // Tab 3
    dateOfJoining: staff.joining_date ?? undefined,
    employmentType: staff.employment_status as any,
    gradeLevel: staff.grade_level as any,

    // Pass staff IDs back to form so it can write to staff_profiles
    ...({
      profileId: staff.id,
      employeeId: staff.employee_id ?? "",
      role: staff.role,
    } as any),
  };
}

// Convert StaffFormData → partial StaffWithDetails (for DB save).
// Real persistence is done by StaffForm via updateStaffProfilePartial/Full.
// This is only used for the parent MyStaff page's onSave callback.
function formDataToStaff(formData: StaffFormData): Partial<StaffWithDetails> {
  const nameParts = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean) as string[];

  const genderToSalutation: Record<string, string> = {
    Male: "Mr.", Female: "Mrs.", Other: "Ms.",
  };
  const salutation = formData.gender
    ? (genderToSalutation[formData.gender] ?? "Mr.")
    : undefined;

  // Pack address object back to flat text (DB still uses text for local_address/permanent_address)
  const localText = (formData as any).localAddress?.line1 ?? "";
  const sameAsLocal = (formData as any).sameAsLocalAddress;
  const permObj = (formData as any).permanentAddress;
  const permText = sameAsLocal ? localText : (permObj?.line1 ?? "");

  return {
    id: (formData as any).profileId,
    full_name: nameParts.join(" "),
    salutation,
    login_mobile: formData.loginMobile,
    email: (formData as any).personalEmail,
    employee_id: (formData as any).employeeId,
    personal_email: (formData as any).personalEmail,
    whatsapp_mobile: (formData as any).whatsappMobile,
    emergency_contact_name: (formData as any).emergencyContactName,
    emergency_contact_number: (formData as any).emergencyContactNumber,
    emergency_contact_relation: (formData as any).emergencyContactRelation,
    local_address: localText,
    permanent_address: permText,
    gender: formData.gender,
    dob: (formData as any).dateOfBirth,
    blood_group: (formData as any).bloodGroup,
    father_first_name: formData.fatherFirstName,
    father_middle_name: formData.fatherMiddleName,
    father_last_name: formData.fatherLastName,
    employment_status: (formData as any).employmentType,
    grade_level: (formData as any).gradeLevel,
    joining_date: (formData as any).dateOfJoining,
  };
}

export function StaffFormOverlay({ staff, schoolId, onClose, onSave, mode = 'view', onDelete, canDelete = false }: StaffFormOverlayProps) {
  const { school } = useAuth();
  const { toggle: toggleMessenger } = useMessengerPanel();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<StaffTabId>("tab1");
  const [identity, setIdentity] = useState<StaffFormIdentity>(() => initialIdentityFromStaff(staff));
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);

  // True while we're in create mode and the Staff ID hasn't been generated yet.
  // Tabs 2-7 stay locked; Close (X) and Cancel trigger the abandon dialog.
  const isCreateLocked = mode === 'create' && !identity.employeeId;

  // Nav items rendered in the overlay header. Clicking a nav item closes the overlay
  // and navigates — same behavior as the underlying AppShell nav.
  const overlayNavItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/messenger", label: "Messages", icon: MessageSquare },
  ];

  const handleNavClick = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (to === "/messenger") {
      onClose();
      toggleMessenger();
      return;
    }
    onClose();
    navigate(to);
  };

  const schoolName = school?.name ?? "SHARP";
  const schoolInitial = schoolName.trim().charAt(0).toUpperCase() || "S";

  const handleIdentityChange = (next: StaffFormIdentity) => {
    setIdentity(next);
  };

  const handleHeaderClose = () => {
    if (isCreateLocked) {
      setAbandonDialogOpen(true);
    } else {
      onClose();
    }
  };

  const handleAbandonConfirm = () => {
    setAbandonDialogOpen(false);
    onClose();
  };

  const initials = staff
    ? (staff.full_name ?? "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleSave = async (formData: StaffFormData) => {
    setSaving(true);
    try {
      const partialStaff = formDataToStaff(formData);
      await onSave(partialStaff);
      if (mode !== 'create') setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Edit / Create mode: show StaffForm
  if (mode === 'create' || isEditing) {
    const fullName = joinName(identity.firstName, identity.middleName, identity.lastName);
    const fatherName = joinName(identity.fatherFirstName, identity.fatherMiddleName, identity.fatherLastName);
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {/* Top-left brand + nav. Top-right identity. Below: the 7-tab form. */}
        <div className="absolute top-3 left-4 z-10 flex items-center gap-3">
          <Link
            to="/"
            onClick={handleNavClick("/")}
            className="flex items-center gap-2 cursor-pointer"
            aria-label={`${schoolName} home`}
          >
            {school?.emblem_url ? (
              <img src={school.emblem_url} alt={schoolName} loading="lazy" decoding="async" className="h-8 w-8 rounded-xl object-cover" style={{ boxShadow: "var(--shadow-md)" }} />
            ) : (
              <div className="h-8 w-8 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground text-xs font-bold" style={{ boxShadow: "var(--shadow-md)" }}>
                {schoolInitial}
              </div>
            )}
            <span className="hidden sm:inline font-semibold text-sm tracking-wide">{schoolName}</span>
          </Link>
          <nav className="flex items-center gap-1 border-l pl-3 ml-1" style={{ borderColor: "hsl(var(--border))" }}>
            {overlayNavItems.map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={handleNavClick(it.to)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200 cursor-pointer"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Persistent identity header — visible on every tab.
            Replaces the previous duplicate tab strip. Stacked 3 rows, top-right. */}
        <div className="absolute top-3 right-14 z-10 text-right space-y-0.5">
          <p className="text-sm">
            <span className="text-muted-foreground">Employee ID - </span>
            {identity.employeeId ? (
              <span className="font-mono font-semibold">{identity.employeeId}</span>
            ) : (
              <span className="text-muted-foreground">Not yet generated</span>
            )}
          </p>
          <p className={cn("text-sm", !fullName && "text-muted-foreground")}>
            <span className="text-muted-foreground">Name - </span>
            <span className="font-medium">{fullName || "—"}</span>
          </p>
          <p className={cn("text-sm", !fatherName && "text-muted-foreground")}>
            <span className="text-muted-foreground">Father&apos;s Name - </span>
            <span className="font-medium">{fatherName || "—"}</span>
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleHeaderClose} className="cursor-pointer absolute top-2 right-2 z-10">
          <X className="h-5 w-5" />
        </Button>

        <div className="p-6 pt-16 overflow-auto h-[calc(100vh)]">
          <div className="max-w-4xl mx-auto">
            <StaffForm
              schoolId={schoolId}
              initialData={staff ? staffToFormData(staff) : undefined}
              onSave={handleSave}
              onCancel={() => mode === 'create' ? onClose() : setIsEditing(false)}
              isEditing={true}
              currentTab={tab}
              onTabChange={setTab}
              staffProfileId={(staff as any)?.profile_id}
              mode={mode === 'create' ? 'create' : 'edit'}
              onAbandon={() => setAbandonDialogOpen(true)}
              onIdentityChange={handleIdentityChange}
            />
          </div>
        </div>

        <Dialog open={abandonDialogOpen} onOpenChange={setAbandonDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abandon new staff?</DialogTitle>
              <DialogDescription>
                No account will be created. Filled data will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAbandonDialogOpen(false)} className="cursor-pointer">
                Keep editing
              </Button>
              <Button variant="destructive" onClick={handleAbandonConfirm} className="cursor-pointer">
                Discard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // View mode: read-only display
  if (!staff) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 bg-background border-l shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-purple-100 text-purple-800 text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{staff.full_name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{staff.employee_id ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={staff.status === "active" ? "default" : "secondary"}>
              {staff.status}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Read-only content */}
        <div className="overflow-auto h-[calc(100vh-73px)] p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <Section title="Basic Information">
              <Field label="Full Name" value={staff.full_name} />
              <Field label="Salutation" value={staff.salutation} />
              <Field label="Employee ID" value={staff.employee_id} />
              <Field label="Designation" value={staff.designation} />
              <Field label="Department" value={staff.department} />
              <Field label="Joining Date" value={staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : undefined} />
            </Section>

            <Section title="Contact Information">
              <Field label="Login Mobile" value={staff.login_mobile} />
              <Field label="WhatsApp" value={staff.whatsapp_mobile} />
              <Field label="Official Email" value={staff.email} />
              <Field label="Personal Email" value={staff.personal_email} />
            </Section>

            <Section title="Address">
              <Field label="Local Address" value={staff.local_address} />
              <Field label="Permanent Address" value={staff.permanent_address} />
            </Section>

            <Section title="Emergency Contact">
              <Field label="Contact Name" value={staff.emergency_contact_name} />
              <Field label="Contact Number" value={staff.emergency_contact_number} />
              <Field label="Relation" value={staff.emergency_contact_relation} />
            </Section>

            <Section title="Employment Details">
              <Field label="Employment Type" value={staff.employment_status} />
              <Field label="Grade Level" value={staff.grade_level} />
              <Field label="Qualification" value={staff.qualification} />
            </Section>

            <Section title="Personal Information">
              <Field label="Gender" value={staff.gender} />
              <Field label="Date of Birth" value={staff.dob ? new Date(staff.dob).toLocaleDateString() : undefined} />
              <Field label="Blood Group" value={staff.blood_group} />
              <Field label="Father's Name" value={staff.father_name} />
            </Section>

            <Section title="Roles & Permissions">
              <Field label="Role" value={staff.role} />
              <Field label="Is Class Teacher" value={staff.is_class_teacher ? "Yes" : "No"} />
              <Field label="Messenger Tag" value={staff.messenger_tag} />
            </Section>

            <div className="flex justify-between gap-3 pt-4 border-t">
              {onDelete && staff && canDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => onDelete(staff)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
