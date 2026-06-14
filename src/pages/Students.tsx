import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

// Student type - placeholder until Supabase types integrated
export interface Student {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentAppId?: string;
  class?: string;
  section?: string;
  rollNo?: number;
  gender?: string;
  status?: string;
  email?: string;
  // Add other student fields as needed
}

// Utility function to generate initials
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Status badge utility
export function statusBadge(status: string) {
  // Placeholder implementation
  return <Badge variant="secondary">{status}</Badge>;
}
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/Field";
import { UploadField } from "@/components/ui/upload-field";
import { studentTab1Schema, studentTab10Schema } from "@/lib/schemas";
import { useGuardedSubmit } from "@/hooks/useGuardedSubmit";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/integrations/supabase/types";

// ─── Form Field Types ─────────────────────────────────────────────────────────

interface StudentFormData {
  // Tab 1: Identity & Academic
  first_name: string;
  middle_name: string;
  last_name: string;
  father_first_name: string;
  father_middle_name: string;
  father_last_name: string;
  gender: "Male" | "Female" | "Other";
  login_mobile: string;
  class_id: string;
  section_id: string;
  house_id: string;

  // Tab 2: Guardian Details
  primary_guardian: "Father" | "Mother" | "Guardian" | "Grandparent" | "Other";
  father_mobile: string;
  father_whatsapp: boolean;
  father_email: string;
  mother_mobile: string;
  mother_whatsapp: boolean;
  mother_email: string;
  guardian_first_name: string;
  guardian_middle_name: string;
  guardian_last_name: string;
  guardian_mobile: string;
  guardian_whatsapp: boolean;
  guardian_relation: string;
  student_mobile: string;
  student_whatsapp: boolean;
  emergency_contact_name: string;
  emergency_contact_number: string;
  emergency_contact_whatsapp: boolean;
  emergency_contact_relation: string;
  email: string;

  // Tab 3: Social & Background
  category: "General" | "SC" | "ST" | "OBC";
  subcaste: string;
  caste_certificate_number: string;
  religion: string;
  religion_specify: string;
  nationality: string;
  mother_tongue: string;
  medium_of_instruction: string;
  minority: boolean;
  only_child: boolean;
  single_parent_orphan: boolean;
  first_generation_learner: boolean;

  // Tab 4: Address
  address_line_1: string;
  address_line_2: string;
  city_village: string;
  district: string;
  state: string;
  pin_code: string;
  same_as_local_address: boolean;
  permanent_address_line_1: string;
  permanent_address_line_2: string;
  permanent_city_village: string;
  permanent_district: string;
  permanent_state: string;
  permanent_pin_code: string;

  // Tab 5: Academic Profile
  admission_date: string;
  admission_type: "New" | "Transfer" | "RTE Quota" | "EWS Quota";
  roll_number: string;
  account_status: "Active" | "Inactive";

  // Tab 6: Photo & Health
  photo: string;
  blood_group: string;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_measurement: string;

  // Tab 7: Parent Information
  school_internal_id: string;
  father_qualification: string;
  father_occupation: string;
  father_photo: string;
  mother_qualification: string;
  mother_occupation: string;
  mother_photo: string;
  mother_education_level: string;
  guardian_qualification: string;
  guardian_occupation: string;
  guardian_photo: string;

  // Tab 8: Transfer & Transport
  previous_school_name: string;
  previous_school_udise: string;
  previous_school_board: string;
  last_exam_class: string;
  last_exam_year: string;
  last_exam_result: string;
  last_exam_percentage: number | null;
  school_leaving_certificate: string;
  opted_for_transport: boolean;
  bus_route: string;
  bus_stop: string;

  // Tab 9: Siblings & Documents
  siblings: Array<{
    sibling_full_name: string;
    sibling_class: string;
    sibling_school: string;
  }>;
  birth_certificate: boolean;
  caste_certificate: boolean;
  marksheet_previous_class: boolean;
  school_leaving_certificate_doc: boolean;
  aadhar_card: boolean;
  disability_certificate_doc: boolean;
  minority_certificate_doc: boolean;
  bank_passbook: boolean;

  // Tab 10: Government IDs & Finance
  aadhar_number: string;
  aadhar_not_available: boolean;
  sssm_id: string;
  sssm_id_card_upload: string;
  family_id_no: string;
  disability_type: "None" | "Locomotor" | "Visual" | "Hearing" | "Other";
  disability_specification: string;
  disability_percentage: number | null;
  disability_certificate: string;
  student_bank_account_no: string;
  ifsc_code: string;
  bank_name: string;
  bank_branch: string;
  bank_passbook_doc: string;
  minority_cert_received: boolean;
  minority_certificate: string;
  receives_free_textbooks: boolean;
  receives_midday_meal: boolean;
  receives_scholarship: boolean;
  scholarship_name: string;
  bpl_aay_ews_status: string;
  rte_admission: boolean;
}


// ─── 10-Tab Student Form Dialog ─────────────────────────────────────────────────

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  initialAadhar?: string;
  onSave: (student: Student, formData: Partial<StudentFormData>) => void;
  schoolId?: string;
}

export function StudentFormDialog({ open, onOpenChange, student, initialAadhar, onSave, schoolId }: StudentFormDialogProps) {
  const isEdit = !!student;
  const [activeTab, setActiveTab] = useState<number>(1);
  const [form, setForm] = useState<StudentFormData>({
    // Tab 1: Identity & Academic
    first_name: "", middle_name: "", last_name: "", father_first_name: "", father_middle_name: "", father_last_name: "",
    gender: "Male" as const, login_mobile: "", class_id: "", section_id: "", house_id: "",
    // Tab 2: Guardian Details
    primary_guardian: "Father" as const, father_mobile: "", father_whatsapp: false, father_email: "",
    mother_mobile: "", mother_whatsapp: false, mother_email: "",
    guardian_first_name: "", guardian_middle_name: "", guardian_last_name: "", guardian_mobile: "", guardian_whatsapp: false,
    guardian_relation: "", student_mobile: "", student_whatsapp: false,
    emergency_contact_name: "", emergency_contact_number: "", emergency_contact_whatsapp: false, emergency_contact_relation: "",
    email: "",
    // Tab 3: Social & Background
    category: "General" as const, subcaste: "", caste_certificate_number: "", religion: "", religion_specify: "",
    nationality: "Indian", mother_tongue: "", medium_of_instruction: "", minority: false, only_child: false,
    single_parent_orphan: false, first_generation_learner: false,
    // Tab 4: Address
    address_line_1: "", address_line_2: "", city_village: "", district: "", state: "", pin_code: "",
    same_as_local_address: false,
    permanent_address_line_1: "", permanent_address_line_2: "", permanent_city_village: "",
    permanent_district: "", permanent_state: "", permanent_pin_code: "",
    // Tab 5: Academic Profile
    admission_date: "", admission_type: "New" as const, roll_number: "", account_status: "Active" as const,
    // Tab 6: Photo & Health
    photo: "", blood_group: "", height_cm: null, weight_kg: null, date_of_measurement: "",
    // Tab 7: Parent Information
    school_internal_id: "", father_qualification: "", father_occupation: "", father_photo: "",
    mother_qualification: "", mother_occupation: "", mother_photo: "", mother_education_level: "",
    guardian_qualification: "", guardian_occupation: "", guardian_photo: "",
    // Tab 8: Transfer & Transport
    previous_school_name: "", previous_school_udise: "", previous_school_board: "", last_exam_class: "",
    last_exam_year: "", last_exam_result: "", last_exam_percentage: null, school_leaving_certificate: "",
    opted_for_transport: false, bus_route: "", bus_stop: "",
    // Tab 9: Siblings & Documents
    siblings: [], birth_certificate: false, caste_certificate: false, marksheet_previous_class: false,
    school_leaving_certificate_doc: false, aadhar_card: false, disability_certificate_doc: false,
    minority_certificate_doc: false, bank_passbook: false,
    // Tab 10: Government IDs & Finance
    aadhar_number: "", aadhar_not_available: false, sssm_id: "", sssm_id_card_upload: "", family_id_no: "",
    disability_type: "None" as const, disability_specification: "", disability_percentage: null,
    disability_certificate: "", student_bank_account_no: "", ifsc_code: "", bank_name: "", bank_branch: "",
    bank_passbook_doc: "", minority_cert_received: false, minority_certificate: "",
    receives_free_textbooks: false, receives_midday_meal: false, receives_scholarship: false,
    scholarship_name: "", bpl_aay_ews_status: "", rte_admission: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tabCompleted, setTabCompleted] = useState<Record<number, boolean>>({1: false});

  // Load classes for this school
  const { data: classesData = [] } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase.from("classes").select("id, name, acronym, display_order")
        .eq("school_id", schoolId).order("display_order", { ascending: true });
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  // Load sections when class is selected
  const { data: sectionsData = [] } = useQuery({
    queryKey: ["sections", form.class_id],
    queryFn: async () => {
      if (!form.class_id) return [];
      const { data } = await supabase.from("sections").select("id, name, acronym, stream")
        .eq("class_id", form.class_id).order("display_order", { ascending: true });
      return data ?? [];
    },
    enabled: !!form.class_id,
  });

  // Fetch houses
  const { data: houses = [] } = useQuery({
    queryKey: ["houses", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data: school } = await supabase.from("schools").select("houses")
        .eq("id", schoolId).single();
      return (school?.houses as Array<{ id: string; name: string }>) ?? [];
    },
    enabled: !!schoolId,
  });

  function handleFieldChange(field: string, value: unknown) {
    setForm(prev => ({...prev, [field]: value}));
  }

  function handleSaveCurrentTab() {
    setTabCompleted(prev => ({...prev, [activeTab]: true}));
    if (activeTab < 10) setActiveTab(prev => prev + 1);
  }

  const tabs = [
    { id: 1, name: "Identity & Academic", locked: false },
    { id: 2, name: "Guardian Details", locked: !tabCompleted[1] },
    { id: 3, name: "Social & Background", locked: !tabCompleted[2] },
    { id: 4, name: "Address", locked: !tabCompleted[3] },
    { id: 5, name: "Academic Profile", locked: !tabCompleted[4] },
    { id: 6, name: "Photo & Health", locked: !tabCompleted[5] },
    { id: 7, name: "Parent Information", locked: !tabCompleted[6] },
    { id: 8, name: "Transfer & Transport", locked: !tabCompleted[7] },
    { id: 9, name: "Siblings & Documents", locked: !tabCompleted[8] },
    { id: 10, name: "Government IDs & Finance", locked: !tabCompleted[9] },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  // Preview roll number
  const selectedClass = classesData.find(c => c.id === form.class_id);
  const selectedSection = sectionsData.find(s => s.id === form.section_id);
  const previewRoll = selectedClass && selectedSection
    ? `${selectedClass.acronym || selectedClass.name.charAt(0)}${selectedSection.stream ? selectedSection.stream.charAt(0) : ""}${selectedSection.acronym || selectedSection.name.charAt(0)}??`
    : "";

  // Save handler
  const { handleSubmit } = useGuardedSubmit(async () => {
    if (activeTab !== 10) {
      handleSaveCurrentTab();
      return;
    }

    // Reserve student ID before save
    let reservationId = null;
    if (!isEdit && schoolId) {
      try {
        const { data: seq } = await supabase.rpc("reserve_student_id", {
          p_school_id: schoolId,
          p_academic_year: "26", // TODO: get from current session
          p_acronym: "SCH", // TODO: fetch from school profile
          p_count: 1,
        });
        reservationId = seq;
      } catch (error) {
        console.error("Failed to reserve student ID:", error);
        setErrors({ studentId: "Failed to reserve Student ID" });
        return;
      }
    }

    // Validate all tabs
    const allErrors: Record<string, string> = {};

    // Validate Tab 1
    if (!studentTab1Schema.safeParse(form).success) {
      const errors = studentTab1Schema.safeParse(form).error?.errors || [];
      errors.forEach(e => allErrors[e.path[0]] = e.message);
    }

    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;

    // Prepare save data
    const saveData = {
      ...form,
      ...(reservationId && { reservation_id: reservationId }),
      student_id: reservationId ? `S26SCH${String(reservationId).padStart(5, '0')}` : undefined,
    };

    // Save the student
    onSave(student, saveData);
  });

  // Tab navigation
  const handleTabChange = (tabId: number) => {
    if (!tabs.find(t => t.id === tabId)?.locked) {
      setActiveTab(tabId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Student" : "Add New Student"}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab.toString()} onValueChange={(v) => handleTabChange(parseInt(v))} className="w-full">
          <TabsList className="grid w-full grid-cols-10">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id.toString()}
                disabled={tab.locked}
                className={`flex-1 min-w-[80px] text-xs ${tab.locked ? "opacity-50" : ""}`}
              >
                {tab.id}. {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab 1: Identity & Academic */}
          <TabsContent value="1" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input value={form.first_name || ""} onChange={e => handleFieldChange("first_name", e.target.value.toUpperCase())} className="clay-input" />
              </div>
              <div>
                <label className="text-sm font-medium">Middle Name</label>
                <Input value={form.middle_name || ""} onChange={e => handleFieldChange("middle_name", e.target.value.toUpperCase())} className="clay-input" />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input value={form.last_name || ""} onChange={e => handleFieldChange("last_name", e.target.value.toUpperCase())} className="clay-input" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Father First Name *</label>
                <Input value={form.father_first_name || ""} onChange={e => handleFieldChange("father_first_name", e.target.value.toUpperCase())} className="clay-input" />
              </div>
              <div>
                <label className="text-sm font-medium">Father Middle Name</label>
                <Input value={form.father_middle_name || ""} onChange={e => handleFieldChange("father_middle_name", e.target.value.toUpperCase())} className="clay-input" />
              </div>
              <div>
                <label className="text-sm font-medium">Father Last Name *</label>
                <Input value={form.father_last_name || ""} onChange={e => handleFieldChange("father_last_name", e.target.value.toUpperCase())} className="clay-input" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Gender *</label>
              <Select value={form.gender || "Male"} onValueChange={v => handleFieldChange("gender", v as any)}>
                <SelectTrigger className="clay-input"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Login Mobile *</label>
              <Input value={form.login_mobile || ""} onChange={e => handleFieldChange("login_mobile", e.target.value)} placeholder="10-digit mobile" className="clay-input" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Class *</label>
                <Select value={form.class_id || ""} onValueChange={v => { handleFieldChange("class_id", v); handleFieldChange("section_id", ""); }}>
                  <SelectTrigger className="clay-input"><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {classesData.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Section *</label>
                <Select value={form.section_id || ""} onValueChange={v => handleFieldChange("section_id", v)} disabled={!form.class_id}>
                  <SelectTrigger className="clay-input"><SelectValue placeholder="Select Section" /></SelectTrigger>
                  <SelectContent>
                    {sectionsData.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.stream ? ` (${s.stream})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">House</label>
              <Select value={form.house_id || ""} onValueChange={v => handleFieldChange("house_id", v)}>
                <SelectTrigger className="clay-input"><SelectValue placeholder="Select House" /></SelectTrigger>
                <SelectContent>
                  {houses.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {previewRoll && (
              <div className="p-3 bg-muted rounded">
                <span className="text-sm">Roll Number (auto): </span>
                <span className="font-mono font-medium">{previewRoll}</span>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Guardian Details */}
          <TabsContent value="2" className="mt-4 space-y-4">
            <div className="space-y-4">
              {/* Primary Guardian - Hidden but determines conditional fields */}
              {form.primary_guardian === "Father" && (
                <>
                  <h3 className="font-semibold text-sm">Father's Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Father's Mobile *</label>
                      <Input value={form.father_mobile || ""} onChange={e => handleFieldChange("father_mobile", e.target.value)} placeholder="10-digit" className="clay-input" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={form.father_whatsapp || false} onChange={e => handleFieldChange("father_whatsapp", e.target.checked)} />
                      <label className="text-sm">WhatsApp</label>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Father's Email</label>
                      <Input type="email" value={form.father_email || ""} onChange={e => handleFieldChange("father_email", e.target.value)} className="clay-input" />
                    </div>
                  </div>
                </>
              )}

              {form.primary_guardian === "Mother" && (
                <>
                  <h3 className="font-semibold text-sm">Mother's Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Mother's Mobile *</label>
                      <Input value={form.mother_mobile || ""} onChange={e => handleFieldChange("mother_mobile", e.target.value)} placeholder="10-digit" className="clay-input" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={form.mother_whatsapp || false} onChange={e => handleFieldChange("mother_whatsapp", e.target.checked)} />
                      <label className="text-sm">WhatsApp</label>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Mother's Email</label>
                      <Input type="email" value={form.mother_email || ""} onChange={e => handleFieldChange("mother_email", e.target.value)} className="clay-input" />
                    </div>
                  </div>
                </>
              )}

              {["Guardian", "Grandparent", "Other"].includes(form.primary_guardian) && (
                <>
                  <h3 className="font-semibold text-sm">Guardian Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Guardian First Name *</label>
                      <Input value={form.guardian_first_name || ""} onChange={e => handleFieldChange("guardian_first_name", e.target.value.toUpperCase())} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Guardian Middle Name</label>
                      <Input value={form.guardian_middle_name || ""} onChange={e => handleFieldChange("guardian_middle_name", e.target.value.toUpperCase())} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Guardian Last Name *</label>
                      <Input value={form.guardian_last_name || ""} onChange={e => handleFieldChange("guardian_last_name", e.target.value.toUpperCase())} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Guardian's Mobile *</label>
                      <Input value={form.guardian_mobile || ""} onChange={e => handleFieldChange("guardian_mobile", e.target.value)} placeholder="10-digit" className="clay-input" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={form.guardian_whatsapp || false} onChange={e => handleFieldChange("guardian_whatsapp", e.target.checked)} />
                      <label className="text-sm">WhatsApp</label>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Guardian Relation *</label>
                      <Input value={form.guardian_relation || ""} onChange={e => handleFieldChange("guardian_relation", e.target.value)} className="clay-input" />
                    </div>
                  </div>
                </>
              )}

              {/* Student Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Student's Mobile</label>
                  <Input value={form.student_mobile || ""} onChange={e => handleFieldChange("student_mobile", e.target.value)} placeholder="10-digit (optional)" className="clay-input" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.student_whatsapp || false} onChange={e => handleFieldChange("student_whatsapp", e.target.checked)} />
                  <label className="text-sm">WhatsApp</label>
                </div>
              </div>

              {/* Emergency Contact */}
              <h3 className="font-semibold text-sm">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Emergency Contact Name *</label>
                  <Input value={form.emergency_contact_name || ""} onChange={e => handleFieldChange("emergency_contact_name", e.target.value.toUpperCase())} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Emergency Contact Number *</label>
                  <Input value={form.emergency_contact_number || ""} onChange={e => handleFieldChange("emergency_contact_number", e.target.value)} placeholder="10-digit" className="clay-input" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.emergency_contact_whatsapp || false} onChange={e => handleFieldChange("emergency_contact_whatsapp", e.target.checked)} />
                  <label className="text-sm">WhatsApp</label>
                </div>
                <div>
                  <label className="text-sm font-medium">Emergency Contact Relation</label>
                  <Input value={form.emergency_contact_relation || ""} onChange={e => handleFieldChange("emergency_contact_relation", e.target.value)} className="clay-input" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email || ""} onChange={e => handleFieldChange("email", e.target.value)} className="clay-input" />
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Social & Background */}
          <TabsContent value="3" className="mt-4 space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Social Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <Select value={form.category || "General"} onValueChange={v => handleFieldChange("category", v as any)}>
                    <SelectTrigger className="clay-input"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                      <SelectItem value="OBC">OBC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {["SC", "ST", "OBC"].includes(form.category) && (
                  <div>
                    <label className="text-sm font-medium">Subcaste *</label>
                    <Input value={form.subcaste || ""} onChange={e => handleFieldChange("subcaste", e.target.value)} className="clay-input" />
                  </div>
                )}
                {["SC", "ST", "OBC"].includes(form.category) && (
                  <div>
                    <label className="text-sm font-medium">Caste Certificate Number *</label>
                    <Input value={form.caste_certificate_number || ""} onChange={e => handleFieldChange("caste_certificate_number", e.target.value)} className="clay-input" />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Religion</label>
                  <Select value={form.religion || ""} onValueChange={v => handleFieldChange("religion", v)}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hinduism">Hinduism</SelectItem>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Christianity">Christianity</SelectItem>
                      <SelectItem value="Sikhism">Sikhism</SelectItem>
                      <SelectItem value="Buddhism">Buddhism</SelectItem>
                      <SelectItem value="Jainism">Jainism</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.religion === "Other" && (
                  <div>
                    <label className="text-sm font-medium">Religion (specify)</label>
                    <Input value={form.religion_specify || ""} onChange={e => handleFieldChange("religion_specify", e.target.value)} className="clay-input" />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Nationality</label>
                  <Input value={form.nationality || "Indian"} onChange={e => handleFieldChange("nationality", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Mother Tongue</label>
                  <Input value={form.mother_tongue || ""} onChange={e => handleFieldChange("mother_tongue", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Medium of Instruction</label>
                  <Select value={form.medium_of_instruction || ""} onValueChange={v => handleFieldChange("medium_of_instruction", v)}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.minority || false} onChange={e => handleFieldChange("minority", e.target.checked)} />
                  <span className="text-sm">Minority</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.only_child || false} onChange={e => handleFieldChange("only_child", e.target.checked)} />
                  <span className="text-sm">Only Child</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.single_parent_orphan || false} onChange={e => handleFieldChange("single_parent_orphan", e.target.checked)} />
                  <span className="text-sm">Single Parent/Orphan</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.first_generation_learner || false} onChange={e => handleFieldChange("first_generation_learner", e.target.checked)} />
                  <span className="text-sm">First Generation Learner</span>
                </label>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Address */}
          <TabsContent value="4" className="mt-4 space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Local Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Address Line 1 *</label>
                  <Input value={form.address_line_1 || ""} onChange={e => handleFieldChange("address_line_1", e.target.value.toUpperCase())} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Address Line 2</label>
                  <Input value={form.address_line_2 || ""} onChange={e => handleFieldChange("address_line_2", e.target.value.toUpperCase())} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">City/Village *</label>
                  <Input value={form.city_village || ""} onChange={e => handleFieldChange("city_village", e.target.value.toUpperCase())} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">District *</label>
                  <Input value={form.district || ""} onChange={e => handleFieldChange("district", e.target.value.toUpperCase())} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">State *</label>
                  <Input value={form.state || ""} onChange={e => handleFieldChange("state", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">PIN Code *</label>
                  <Input value={form.pin_code || ""} onChange={e => handleFieldChange("pin_code", e.target.value)} placeholder="6-digit" className="clay-input" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="sameAsLocal" checked={form.same_as_local_address || false} onChange={e => handleFieldChange("same_as_local_address", e.target.checked)} />
                <label htmlFor="sameAsLocal" className="text-sm">Same as Local Address</label>
              </div>

              {!form.same_as_local_address && (
                <div className="border rounded p-4 space-y-3">
                  <h4 className="font-medium">Permanent Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input placeholder="Permanent Address Line 1 *" value={form.permanent_address_line_1 || ""} onChange={e => handleFieldChange("permanent_address_line_1", e.target.value.toUpperCase())} className="clay-input" />
                    </div>
                    <div>
                      <Input placeholder="Permanent Address Line 2" value={form.permanent_address_line_2 || ""} onChange={e => handleFieldChange("permanent_address_line_2", e.target.value.toUpperCase())} className="clay-input" />
                    </div>
                    <div>
                      <Input placeholder="Permanent City/Village *" value={form.permanent_city_village || ""} onChange={e => handleFieldChange("permanent_city_village", e.target.value.toUpperCase())} className="clay-input" />
                    </div>
                    <div>
                      <Input placeholder="Permanent District *" value={form.permanent_district || ""} onChange={e => handleFieldChange("permanent_district", e.target.value.toUpperCase())} className="clay-input" />
                    </div>
                    <div>
                      <Input placeholder="Permanent State *" value={form.permanent_state || ""} onChange={e => handleFieldChange("permanent_state", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <Input placeholder="Permanent PIN Code *" value={form.permanent_pin_code || ""} onChange={e => handleFieldChange("permanent_pin_code", e.target.value)} className="clay-input" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 5: Academic Profile */}
          <TabsContent value="5" className="mt-4 space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Admission Date *</label>
                  <Input type="date" value={form.admission_date || ""} onChange={e => handleFieldChange("admission_date", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Admission Type</label>
                  <Select value={form.admission_type || "New"} onValueChange={v => handleFieldChange("admission_type", v as any)}>
                    <SelectTrigger className="clay-input"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="RTE Quota">RTE Quota</SelectItem>
                      <SelectItem value="EWS Quota">EWS Quota</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Account Status</label>
                  <Select value={form.account_status || "Active"} onValueChange={v => handleFieldChange("account_status", v as any)}>
                    <SelectTrigger className="clay-input"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {previewRoll && (
                <div className="p-3 bg-muted rounded">
                  <span className="text-sm">Roll Number (auto): </span>
                  <span className="font-mono font-medium">{previewRoll}</span>
                </div>
              )}

              {/* Transfer details (conditional) */}
              {(form.previous_school_name || form.admission_type === "Transfer") && (
                <div className="border rounded p-4 space-y-3">
                  <h4 className="font-medium">Transfer Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Previous School Name</label>
                      <Input value={form.previous_school_name || ""} onChange={e => handleFieldChange("previous_school_name", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Previous School UDISE</label>
                      <Input value={form.previous_school_udise || ""} onChange={e => handleFieldChange("previous_school_udise", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Previous School Board</label>
                      <Input value={form.previous_school_board || ""} onChange={e => handleFieldChange("previous_school_board", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Exam Class</label>
                      <Input value={form.last_exam_class || ""} onChange={e => handleFieldChange("last_exam_class", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Exam Year</label>
                      <Input value={form.last_exam_year || ""} onChange={e => handleFieldChange("last_exam_year", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Exam Result</label>
                      <Input value={form.last_exam_result || ""} onChange={e => handleFieldChange("last_exam_result", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Exam Percentage</label>
                      <Input type="number" value={form.last_exam_percentage || ""} onChange={e => handleFieldChange("last_exam_percentage", Number(e.target.value))} className="clay-input" />
                    </div>
                  </div>
                  <UploadField label="School Leaving Certificate" value={form.school_leaving_certificate || ""} onChange={(v) => handleFieldChange("school_leaving_certificate", v)} />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 6: Photo & Health */}
          <TabsContent value="6" className="mt-4 space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Student Photo</h3>
              <UploadField label="Photo *" value={form.photo || ""} onChange={(v) => handleFieldChange("photo", v)} />

              <h3 className="font-semibold text-sm">Health Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Blood Group</label>
                  <Select value={form.blood_group || ""} onValueChange={v => handleFieldChange("blood_group", v)}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Height (cm)</label>
                  <Input type="number" value={form.height_cm || ""} onChange={e => handleFieldChange("height_cm", Number(e.target.value))} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <Input type="number" value={form.weight_kg || ""} onChange={e => handleFieldChange("weight_kg", Number(e.target.value))} className="clay-input" />
                </div>
              </div>
              {(form.height_cm || form.weight_kg) && (
                <div>
                  <label className="text-sm font-medium">Date of Measurement</label>
                  <Input type="date" value={form.date_of_measurement || ""} onChange={e => handleFieldChange("date_of_measurement", e.target.value)} className="clay-input" />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 7: Parent Information */}
          <TabsContent value="7" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">School Internal ID (Optional)</label>
                <Input value={form.school_internal_id || ""} onChange={e => handleFieldChange("school_internal_id", e.target.value)} className="clay-input" />
              </div>

              <h3 className="font-semibold text-sm">Father's Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Father's Qualification</label>
                  <Input value={form.father_qualification || ""} onChange={e => handleFieldChange("father_qualification", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Father's Occupation</label>
                  <Input value={form.father_occupation || ""} onChange={e => handleFieldChange("father_occupation", e.target.value)} className="clay-input" />
                </div>
              </div>
              <UploadField label="Father's Photo" value={form.father_photo || ""} onChange={(v) => handleFieldChange("father_photo", v)} />

              <h3 className="font-semibold text-sm">Mother's Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Mother's Qualification</label>
                  <Input value={form.mother_qualification || ""} onChange={e => handleFieldChange("mother_qualification", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Mother's Occupation</label>
                  <Input value={form.mother_occupation || ""} onChange={e => handleFieldChange("mother_occupation", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Mother's Education Level</label>
                  <Select value={form.mother_education_level || ""} onValueChange={v => handleFieldChange("mother_education_level", v)}>
                    <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Illiterate">Illiterate</SelectItem>
                      <SelectItem value="Primary">Primary</SelectItem>
                      <SelectItem value="Middle">Middle</SelectItem>
                      <SelectItem value="Secondary">Secondary</SelectItem>
                      <SelectItem value="Higher Secondary">Higher Secondary</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                      <SelectItem value="Post Graduate">Post Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <UploadField label="Mother's Photo" value={form.mother_photo || ""} onChange={(v) => handleFieldChange("mother_photo", v)} />

              {["Guardian", "Grandparent", "Other"].includes(form.primary_guardian) && (
                <>
                  <h3 className="font-semibold text-sm">Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Guardian's Qualification</label>
                      <Input value={form.guardian_qualification || ""} onChange={e => handleFieldChange("guardian_qualification", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Guardian's Occupation</label>
                      <Input value={form.guardian_occupation || ""} onChange={e => handleFieldChange("guardian_occupation", e.target.value)} className="clay-input" />
                    </div>
                  </div>
                  <UploadField label="Guardian's Photo" value={form.guardian_photo || ""} onChange={(v) => handleFieldChange("guardian_photo", v)} />
                </>
              )}
            </div>
          </TabsContent>

          {/* Tab 8: Transfer & Transport */}
          <TabsContent value="8" className="mt-4 space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Transport Information</h3>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.opted_for_transport || false} onChange={e => handleFieldChange("opted_for_transport", e.target.checked)} />
                <label className="text-sm">Opted for Transport</label>
              </div>
              {form.opted_for_transport && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Bus Route</label>
                    <Input value={form.bus_route || ""} onChange={e => handleFieldChange("bus_route", e.target.value)} className="clay-input" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bus Stop</label>
                    <Input value={form.bus_stop || ""} onChange={e => handleFieldChange("bus_stop", e.target.value)} className="clay-input" />
                  </div>
                </div>
              )}

              {(form.previous_school_name || form.admission_type === "Transfer") && (
                <div className="border rounded p-4 space-y-3 mt-4">
                  <h4 className="font-medium">Transfer Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Previous School Name</label>
                      <Input value={form.previous_school_name || ""} onChange={e => handleFieldChange("previous_school_name", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Previous School UDISE</label>
                      <Input value={form.previous_school_udise || ""} onChange={e => handleFieldChange("previous_school_udise", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Previous School Board</label>
                      <Input value={form.previous_school_board || ""} onChange={e => handleFieldChange("previous_school_board", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Exam Class</label>
                      <Input value={form.last_exam_class || ""} onChange={e => handleFieldChange("last_exam_class", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Exam Year</label>
                      <Input value={form.last_exam_year || ""} onChange={e => handleFieldChange("last_exam_year", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Exam Result</label>
                      <Input value={form.last_exam_result || ""} onChange={e => handleFieldChange("last_exam_result", e.target.value)} className="clay-input" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Exam Percentage</label>
                      <Input type="number" value={form.last_exam_percentage || ""} onChange={e => handleFieldChange("last_exam_percentage", Number(e.target.value))} className="clay-input" />
                    </div>
                  </div>
                  <UploadField label="School Leaving Certificate" value={form.school_leaving_certificate || ""} onChange={(v) => handleFieldChange("school_leaving_certificate", v)} />
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 9: Siblings & Documents */}
          <TabsContent value="9" className="mt-4 space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Siblings</h3>
              <div className="border rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Add up to 5 siblings</label>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    if ((form.siblings?.length || 0) < 5) {
                      handleFieldChange("siblings", [...(form.siblings || []), {sibling_full_name: "", sibling_class: "", sibling_school: ""}]);
                    }
                  }}>+ Add Sibling</Button>
                </div>
                {form.siblings?.map((sib, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                    <Input placeholder="Full Name" value={sib.sibling_full_name || ""} onChange={e => {
                      const newSiblings = [...(form.siblings || [])];
                      newSiblings[idx] = {...newSiblings[idx], sibling_full_name: e.target.value};
                      handleFieldChange("siblings", newSiblings);
                    }} className="clay-input" />
                    <Input placeholder="Class" value={sib.sibling_class || ""} onChange={e => {
                      const newSiblings = [...(form.siblings || [])];
                      newSiblings[idx] = {...newSiblings[idx], sibling_class: e.target.value};
                      handleFieldChange("siblings", newSiblings);
                    }} className="clay-input" />
                    <Input placeholder="School" value={sib.sibling_school || ""} onChange={e => {
                      const newSiblings = [...(form.siblings || [])];
                      newSiblings[idx] = {...newSiblings[idx], sibling_school: e.target.value};
                      handleFieldChange("siblings", newSiblings);
                    }} className="clay-input" />
                  </div>
                ))}
              </div>

              <h3 className="font-semibold text-sm">Documents Received</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.birth_certificate || false} onChange={e => handleFieldChange("birth_certificate", e.target.checked)} />
                    <span className="text-sm">Birth Certificate</span>
                  </label>
                  <UploadField value="" onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.caste_certificate || false} onChange={e => handleFieldChange("caste_certificate", e.target.checked)} />
                    <span className="text-sm">Caste Certificate</span>
                  </label>
                  <UploadField value="" onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.marksheet_previous_class || false} onChange={e => handleFieldChange("marksheet_previous_class", e.target.checked)} />
                    <span className="text-sm">Marksheet of Previous Class</span>
                  </label>
                  <UploadField value="" onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.school_leaving_certificate_doc || false} onChange={e => handleFieldChange("school_leaving_certificate_doc", e.target.checked)} />
                    <span className="text-sm">School Leaving Certificate</span>
                  </label>
                  <UploadField value="" onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.aadhar_card || false} onChange={e => handleFieldChange("aadhar_card", e.target.checked)} />
                    <span className="text-sm">Aadhar Card</span>
                  </label>
                  <UploadField value="" onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.disability_certificate_doc || false} onChange={e => handleFieldChange("disability_certificate_doc", e.target.checked)} />
                    <span className="text-sm">Disability Certificate</span>
                  </label>
                  <UploadField value="" onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.minority_certificate_doc || false} onChange={e => handleFieldChange("minority_certificate_doc", e.target.checked)} />
                    <span className="text-sm">Minority Certificate</span>
                  </label>
                  <UploadField value="" onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.bank_passbook || false} onChange={e => handleFieldChange("bank_passbook", e.target.checked)} />
                    <span className="text-sm">Bank Passbook</span>
                  </label>
                  <UploadField value="" onChange={() => {}} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 10: Government IDs & Finance */}
          <TabsContent value="10" className="mt-4 space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Government IDs</h3>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="aadharNA" checked={form.aadhar_not_available || false} onChange={e => handleFieldChange("aadhar_not_available", e.target.checked)} />
                <label htmlFor="aadharNA" className="text-sm">Aadhar Not Available</label>
              </div>
              {!form.aadhar_not_available && (
                <div>
                  <label className="text-sm font-medium">Aadhar Number (12 digits)</label>
                  <Input value={form.aadhar_number || ""} onChange={e => handleFieldChange("aadhar_number", e.target.value)} className="clay-input" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">SSSM ID (Samagra)</label>
                <Input value={form.sssm_id || ""} onChange={e => handleFieldChange("sssm_id", e.target.value)} className="clay-input" />
                {form.sssm_id && (
                  <UploadField label="SSSM ID Card" value={form.sssm_id_card_upload || ""} onChange={(v) => handleFieldChange("sssm_id_card_upload", v)} />
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Family ID No.</label>
                <Input value={form.family_id_no || ""} onChange={e => handleFieldChange("family_id_no", e.target.value)} className="clay-input" />
              </div>

              <h3 className="font-semibold text-sm">Disability Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Disability Type</label>
                  <Select value={form.disability_type || "None"} onValueChange={v => handleFieldChange("disability_type", v as any)}>
                    <SelectTrigger className="clay-input"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Locomotor">Locomotor</SelectItem>
                      <SelectItem value="Visual">Visual</SelectItem>
                      <SelectItem value="Hearing">Hearing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.disability_type === "Other" && (
                  <div>
                    <label className="text-sm font-medium">Disability Specification</label>
                    <Input value={form.disability_specification || ""} onChange={e => handleFieldChange("disability_specification", e.target.value)} className="clay-input" />
                  </div>
                )}
                {form.disability_type !== "None" && (
                  <div>
                    <label className="text-sm font-medium">Disability Percentage</label>
                    <Input type="number" value={form.disability_percentage || ""} onChange={e => handleFieldChange("disability_percentage", Number(e.target.value))} className="clay-input" />
                  </div>
                )}
                {form.disability_type !== "None" && (
                  <UploadField label="Disability Certificate" value={form.disability_certificate || ""} onChange={(v) => handleFieldChange("disability_certificate", v)} />
                )}
              </div>

              <h3 className="font-semibold text-sm">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Student Bank A/C No.</label>
                  <Input value={form.student_bank_account_no || ""} onChange={e => handleFieldChange("student_bank_account_no", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">IFSC Code</label>
                  <Input value={form.ifsc_code || ""} onChange={e => handleFieldChange("ifsc_code", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bank Name</label>
                  <Input value={form.bank_name || ""} onChange={e => handleFieldChange("bank_name", e.target.value)} className="clay-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bank Branch</label>
                  <Input value={form.bank_branch || ""} onChange={e => handleFieldChange("bank_branch", e.target.value)} className="clay-input" />
                </div>
              </div>
              <UploadField label="Bank Passbook" value={form.bank_passbook_doc || ""} onChange={(v) => handleFieldChange("bank_passbook_doc", v)} />

              <h3 className="font-semibold text-sm">UDISE Welfare Flags</h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.receives_free_textbooks || false} onChange={e => handleFieldChange("receives_free_textbooks", e.target.checked)} />
                  <span className="text-sm">Receives Free Textbooks</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.receives_midday_meal || false} onChange={e => handleFieldChange("receives_midday_meal", e.target.checked)} />
                  <span className="text-sm">Receives Midday Meal</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.receives_scholarship || false} onChange={e => handleFieldChange("receives_scholarship", e.target.checked)} />
                  <span className="text-sm">Receives Scholarship</span>
                </label>
                {form.receives_scholarship && (
                  <div className="ml-2">
                    <label className="text-sm font-medium">Scholarship Name</label>
                    <Input value={form.scholarship_name || ""} onChange={e => handleFieldChange("scholarship_name", e.target.value)} className="clay-input" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">BPL / AAY / EWS Status</label>
                <Select value={form.bpl_aay_ews_status || ""} onValueChange={v => handleFieldChange("bpl_aay_ews_status", v)}>
                  <SelectTrigger className="clay-input"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="BPL">BPL</SelectItem>
                    <SelectItem value="AAY">AAY</SelectItem>
                    <SelectItem value="EWS">EWS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="rteAdmission" checked={form.admission_type === "RTE Quota" || form.rte_admission} onChange={e => handleFieldChange("rte_admission", e.target.checked)} />
                <label htmlFor="rteAdmission" className="text-sm">RTE Admission (Auto if RTE Quota)</label>
              </div>

              {form.minority && (
                <div className="border rounded p-4 space-y-3">
                  <h4 className="font-medium">Minority Details</h4>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="minorityCertReceived" checked={form.minority_cert_received || false} onChange={e => handleFieldChange("minority_cert_received", e.target.checked)} />
                    <label htmlFor="minorityCertReceived" className="text-sm">Minority Certificate Received</label>
                  </div>
                  <UploadField label="Minority Certificate" value={form.minority_certificate || ""} onChange={(v) => handleFieldChange("minority_certificate", v)} />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="clay-btn cursor-pointer">Cancel</Button>
          <Button onClick={handleSubmit} className="clay-btn clay-btn-primary cursor-pointer">
            {activeTab === 10 ? "Create Student" : "Save & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Import Dialog ────────────────────────────────────────────────────────

const BULK_COLUMNS = [
  "student_id_no","first_name","last_name","gender","date_of_birth",
  "class","section","roll_number","admission_date",
  "father_full_name","father_mobile","login_mobile","account_status","category",
];

const BULK_TEMPLATE_CSV = BULK_COLUMNS.join(",") + "\n";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: StudentFormData[]) => void;
}

function BulkImportDialog({ open, onOpenChange, onImport }: BulkImportDialogProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<StudentFormData[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseCSV(text: string): { headers: string[]; data: Record<string, string>[] } | null {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return null;
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const data = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      return obj;
    });
    return { headers, data };
  }

  function validateRow(row: Record<string, string>, rowIndex: number): string[] {
    const errs: string[] = [];
    const required = ["student_id_no","first_name","last_name","gender","date_of_birth","class","section","roll_number","admission_date","father_full_name","father_mobile","login_mobile","account_status","category"];
    // ... validation logic
    return errs;
  }

  // ... rest of the BulkImportDialog implementation
}

export default function StudentsPage() { /* ... */ }