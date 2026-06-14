import { z } from "zod";

// ─── Shared field schemas ─────────────────────────────────────────────────────

/** Converts to uppercase on parse — use for all name/address/text fields */
export const upperString = (min: number, max: number, error: string) =>
  z.string().trim().min(min, error).max(max).transform((v) => v.toUpperCase());

/** Exactly 10 digit Indian mobile number */
export const phoneSchema = z
  .string()
  .min(10, "Enter 10 digit mobile number")
  .max(10, "Enter 10 digit mobile number")
  .regex(/^\d{10}$/, "Enter 10 digit mobile number");

/** Optional 10 digit phone (father/mother/emergency contact) */
export const phoneOptionalSchema = z
  .string()
  .regex(/^\d{10}$/, "Enter 10 digit mobile number")
  .or(z.literal(""))
  .optional();

/** Email with optional empty string */
export const emailOptionalSchema = z.string().email("Invalid email").or(z.literal("")).optional();

// ─── School schemas ────────────────────────────────────────────────────────────

export const schoolCoreSchema = z.object({
  name: upperString(2, 120, "School name required"),
  acronym: upperString(1, 10, "Acronym required"),
  address: upperString(3, 255, "Address required"),
  city: upperString(1, 80, "City required"),
  state: z.string().min(1, "State required"),
  contact_phone: phoneSchema,
  contact_email: z.string().email("Invalid email"),
  board: z.string().min(1, "Board required"),
  state_board_name: z.string().optional(),
  school_type: z.string().min(1, "Type required"),
  emblem_url: z.string().min(1, "School emblem required"),
  shifts: z
    .array(z.object({ name: z.string().min(1), start_time: z.string(), end_time: z.string() }))
    .min(1, "At least one shift required"),
});

/** Onboarding step 1 validation — Principal only fills shifts, houses, departments */
export const schoolOnboardingSchema = z.object({
  shifts: z
    .array(z.object({ name: z.string().min(1), start_time: z.string(), end_time: z.string() }))
    .min(1, "At least one shift required"),
  houses: z.array(
    z.object({ name: z.string().min(1), color: z.string(), emblem_url: z.string().optional() }),
  ),
  departments: z.array(z.string()).min(1, "At least one department required"),
});

export const schoolSuperAdminSchema = z.object({
  // Identity
  schoolName: upperString(2, 120, "School name is required"),
  schoolAcronym: upperString(1, 10, "Acronym is required"),
  academicBoard: z.string().min(1, "Academic board is required"),
  schoolType: z.string().min(1, "School type is required"),
  affiliationNumber: z.string().optional(),
  // Location
  address: upperString(5, 255, "Address is required"),
  city: upperString(2, 80, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  // Principal
  principalName: upperString(2, 100, "Principal name is required"),
  principalEmail: z.string().trim().email("Enter a valid principal email"),
  principalMobile: phoneSchema,
});

export type SchoolSuperAdminForm = z.infer<typeof schoolSuperAdminSchema>;

// ─── Student schemas — 10-Tab Wizard ───────────────────────────────────

// Tab 1 — Identity (Compulsory, Locked First)
export const studentTab1Schema = z.object({
  // Student name
  first_name: upperString(2, 50, "First name required"),
  middle_name: z.string().max(50).optional(),
  last_name: upperString(1, 50, "Last name required"),
  // Father name
  father_first_name: upperString(1, 50, "Father first name required"),
  father_middle_name: z.string().max(50).optional(),
  father_last_name: upperString(1, 50, "Father last name required"),
  // Gender
  gender: z.enum(["Male", "Female", "Other"]),
  // Login
  login_mobile: phoneSchema,
  // Academic
  class_id: z.string().uuid("Select a valid class"),
  section_id: z.string().uuid("Select a valid section"),
  // Subjects (Class 11/12 custom combination)
  subjects: z.array(z.string()).optional(),
  // House
  house_id: z.string().uuid("Select a house").optional(),
});

// Tab 2 — Photo & Family
export const studentTab2Schema = z.object({
  photo: z.string().optional(),
  father_photo: z.string().optional(),
  mother_photo: z.string().optional(),
  guardian_photo: z.string().optional(),
  // Siblings (soft cap 5, warn at 6)
  siblings: z.array(z.object({
    sibling_full_name: z.string().optional(),
    sibling_class: z.string().optional(),
    sibling_school: z.string().optional(),
  })).max(5).optional(),
});

// Tab 3 — Personal Profile
export const studentTab3Schema = z.object({
  dob: z.string().min(1, "Date of birth required"),
  primary_guardian: z.enum(["Father", "Mother", "Guardian", "Grandparent", "Other"]),
  // Father contact
  father_mobile: phoneOptionalSchema,
  father_mobile_whatsapp: z.boolean().optional(),
  father_email: emailOptionalSchema,
  // Mother contact
  mother_mobile: phoneOptionalSchema,
  mother_mobile_whatsapp: z.boolean().optional(),
  mother_email: emailOptionalSchema,
  // Guardian contact (conditional)
  guardian_mobile: phoneOptionalSchema,
  guardian_relation: z.string().optional(),
  guardian_email: emailOptionalSchema,
  // Student mobile
  student_mobile: phoneOptionalSchema,
  student_mobile_whatsapp: z.boolean().optional(),
  // Emergency contact
  emergency_contact_name: upperString(1, 100, "Emergency contact name required"),
  emergency_contact_number: phoneSchema,
  emergency_contact_relation: z.string().min(1, "Relation required"),
  // Email
  email: emailOptionalSchema,
});

// Tab 4 — Address & Location
export const studentTab4Schema = z.object({
  address_line_1: upperString(3, 255, "Address required"),
  address_line_2: z.string().max(255).optional(),
  city_village: upperString(1, 80, "City required"),
  district: upperString(1, 80, "District required"),
  state: z.string().min(1, "State required"),
  pin_code: z.string().regex(/^\d{6}$/, "PIN must be 6 digits"),
  same_as_local_address: z.boolean().default(false),
  // Permanent address (conditional)
  permanent_address_line_1: z.string().optional(),
  permanent_address_line_2: z.string().optional(),
  permanent_city_village: z.string().optional(),
  permanent_district: z.string().optional(),
  permanent_state: z.string().optional(),
  permanent_pin_code: z.string().optional(),
});

// Tab 5 — Academic & House
export const studentTab5Schema = z.object({
  admission_date: z.string().min(1, "Admission date required"),
  admission_type: z.enum(["New", "Transfer", "RTE Quota", "EWS Quota"]).default("New"),
  // Transfer (conditional)
  previous_school_name: z.string().optional(),
  previous_school_udise: z.string().optional(),
  previous_school_board: z.string().optional(),
  last_exam_class: z.string().optional(),
  last_exam_year: z.string().optional(),
  last_exam_result: z.enum(["Pass", "Fail", "Distinction"]).optional(),
  last_exam_percentage: z.coerce.number().min(0).max(100).optional(),
  school_leaving_certificate: z.string().optional(),
  // Roll number (auto-generated, read-only)
  roll_no: z.string().optional(),
});

// Tab 6 — Family Extended
export const studentTab6Schema = z.object({
  father_qualification: z.string().optional(),
  father_occupation: z.string().optional(),
  mother_qualification: z.string().optional(),
  mother_occupation: z.string().optional(),
  mother_education_level: z.enum(["Illiterate", "Primary", "Middle", "Secondary", "Higher Secondary", "Graduate", "Post Graduate"]).optional(),
  // Guardian (conditional)
  guardian_qualification: z.string().optional(),
  guardian_occupation: z.string().optional(),
});

// Tab 7 — Operational
export const studentTab7Schema = z.object({
  blood_group: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  school_internal_id: z.string().optional(),
  // Transport (conditional)
  opted_for_transport: z.boolean().default(false),
  bus_route: z.string().optional(),
  bus_stop: z.string().optional(),
  // Social
  category: z.enum(["General", "SC", "ST", "OBC"]).default("General"),
  subcaste: z.string().optional(),
  caste_certificate_number: z.string().optional(),
  religion: z.enum(["Buddhism", "Christianity", "Hinduism", "Islam", "Judaism", "Sikhism", "Atheist", "Zoroastrianism", "Jainism", "Non-Religious", "Other"]).optional(),
  religion_specify: z.string().optional(),
  nationality: z.string().default("Indian"),
  mother_tongue: z.string().optional(),
  medium_of_instruction: z.enum(["Hindi", "English", "Other"]).optional(),
  minority: z.boolean().default(false),
  only_child: z.boolean().default(false),
  single_parent_orphan: z.boolean().default(false),
  first_generation_learner: z.boolean().default(false),
});

// Tab 8 — Government IDs
export const studentTab8Schema = z.object({
  aadhar_number: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits").or(z.literal("")).optional(),
  aadhar_not_available: z.boolean().default(false),
  // SSSM/Family ID (conditional on state=MP)
  sssm_id: z.string().optional(),
  sssm_id_card_upload: z.string().optional(),
  family_id_no: z.string().optional(),
});

// Tab 9 — Bank Details
export const studentTab9Schema = z.object({
  student_bank_account_no: z.string().optional(),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format").optional(),
  bank_name: z.string().optional(),
  bank_branch: z.string().optional(),
  bank_passbook: z.string().optional(),
});

// Tab 10 — Medical & Disability
export const studentTab10Schema = z.object({
  // Disability
  disability_type: z.enum(["None", "Locomotor", "Visual", "Hearing", "Other"]).default("None"),
  disability_specification: z.string().optional(),
  disability_percentage: z.coerce.number().min(0).max(100).optional(),
  disability_certificate: z.string().optional(),
  // Health
  height_cm: z.coerce.number().positive().optional(),
  weight_kg: z.coerce.number().positive().optional(),
  date_of_measurement: z.string().optional(),
  // Minority
  minority_cert_received: z.boolean().optional(),
  minority_certificate: z.string().optional(),
  // Welfare flags
  receives_free_textbooks: z.boolean().optional(),
  receives_midday_meal: z.boolean().optional(),
  receives_scholarship: z.boolean().optional(),
  scholarship_name: z.string().optional(),
  bpl_aay_ews_status: z.enum(["None", "BPL", "AAY", "EWS"]).optional(),
  rte_admission: z.boolean().optional(),
});

// Full merged student form (all 10 tabs)
export const studentSchema = studentTab1Schema
  .merge(studentTab2Schema)
  .merge(studentTab3Schema)
  .merge(studentTab4Schema)
  .merge(studentTab5Schema)
  .merge(studentTab6Schema)
  .merge(studentTab7Schema)
  .merge(studentTab8Schema)
  .merge(studentTab9Schema)
  .merge(studentTab10Schema);

export type StudentFormData = z.infer<typeof studentSchema>;

// ─── Staff schemas ─────────────────────────────────────────────────────────────

// ─── Row sub-schemas (repeating tables) ────────────────────────────────────────

export const educationRowSchema = z.object({
  level: z.array(z.string()).min(1, "Select at least one level").max(6),
  yearOfPassing: z.string().regex(/^\d{4}$/, "Enter 4-digit year").refine((y) => {
    const yr = parseInt(y, 10);
    return yr >= 1950 && yr <= new Date().getFullYear();
  }, "Year must be in the past"),
  degreeName: z.string().min(1, "Degree name required").max(120),
  subject: z.string().min(1, "Subject required").max(120),
  institution: z.string().min(1, "Institution required").max(200),
  boardUniversity: z.string().min(1, "Board/University required").max(200),
  state: z.string().optional(),
  percentageOrCgpa: z.union([z.coerce.number().min(0).max(100), z.coerce.number().min(0).max(10)]).optional(),
  medium: z.enum(["Hindi", "English", "Other"]).optional(),
  certificateUrl: z.string().optional(),
});

export const certificationRowSchema = z.object({
  subjectSkillName: z.string().min(1, "Subject/skill required").max(120),
  courseName: z.string().min(1, "Course name required").max(200),
  institute: z.string().min(1, "Institute required").max(200),
  duration: z.string().max(60).optional(),
  haveCertificate: z.boolean().default(false),
  certificateUrl: z.string().optional(),
});

export const experienceRowSchema = z.object({
  organization: z.string().min(1, "Organization required").max(200),
  fromYear: z
    .coerce.number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear()),
  toYear: z
    .union([
      z
        .coerce.number()
        .int()
        .min(1900, "Year must be 1900 or later")
        .max(new Date().getFullYear() + 1),
      z.literal("Present"),
    ])
    .optional(),
  workingHoursPerWeek: z.coerce.number().int().min(1).max(80).optional(),
  boardType: z.enum(["CBSE", "ICSE", "IB", "State Board", "Private", "Other"]).optional(),
  classesTaught: z.string().max(120).optional(),
  postHeld: z.string().min(1, "Post held required").max(120),
  subjectsTaught: z.string().max(200).optional(),
  reasonForLeaving: z.string().max(500).optional(),
});

export const childRowSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  age: z.coerce.number().int().min(0).max(30).optional(),
  sex: z.enum(["Male", "Female", "Other"]).optional(),
  classSchool: z.string().max(200).optional(),
});

export const referenceRowSchema = z.object({
  name: z.string().min(1, "Name required").max(120),
  designationRelation: z.string().min(1, "Designation/relation required").max(200),
  address: z.string().min(1, "Address required").max(300),
  telMobile: phoneSchema,
  email: emailOptionalSchema,
});

export const languageRowSchema = z.object({
  language: z.string().min(1, "Language required").max(60),
  canSpeak: z.boolean().default(false),
  canRead: z.boolean().default(false),
  canWrite: z.boolean().default(false),
});

// ─── Address object schema ─────────────────────────────────────────────────────

export const addressSchema = z.object({
  line1: z.string().max(200).optional(),
  cityVillage: z.string().max(80).optional(),
  district: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  pinCode: z.string().regex(/^\d{6}$/, "Enter 6-digit PIN").or(z.literal("")).optional(),
});

// ─── Tab 1 — Identity & Account ───────────────────────────────────────────────
// MINIMUM required to create Staff ID. All fields locked after Staff_ID generated.
export const staffTab1Schema = z.object({
  firstName: upperString(1, 30, "First name required"),
  middleName: z.string().max(30).optional(),
  lastName: upperString(1, 30, "Last name required"),
  fatherFirstName: upperString(1, 30, "Father first name required"),
  fatherMiddleName: z.string().max(30).optional(),
  fatherLastName: upperString(1, 30, "Father last name required"),
  gender: z.enum(["Male", "Female", "Other"]),
  loginMobile: phoneSchema,
  yearOfJoining: z.coerce.number().int().min.max,
});

// ─── Tab 2 — Personal & Contact ───────────────────────────────────────────────
export const staffTab2Schema = z.object({
  // Personal & Demographics
  dateOfBirth: z.string().optional(),
  photoUrl: z.string().optional(),
  nationality: z.string().default("Indian"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  languages: z.array(languageRowSchema).default([]),

  // Social / Category
  category: z.enum(["General", "SC", "ST", "OBC"]).optional(),
  subcaste: z.string().max(100).optional(),
  casteCertificateNumber: z.string().max(60).optional(),
  religion: z.enum(["Buddhism", "Christianity", "Hinduism", "Islam", "Judaism", "Sikhism", "Atheist", "Zoroastrianism", "Jainism", "Non-Religious", "Other"]).optional(),
  religionSpecify: z.string().max(60).optional(),
  minority: z.boolean().default(false),

  // Family
  maritalStatus: z.enum(["Unmarried", "Married", "Widowed", "Divorced", "Separated"]).optional(),
  dateOfMarriage: z.string().optional(),
  spouseName: z.string().max(120).optional(),
  spouseOccupation: z.string().max(120).optional(),
  spouseContact: phoneOptionalSchema,
  fatherOccupation: z.string().max(120).optional(),
  fatherContact: phoneOptionalSchema,
  husbandOccupation: z.string().max(120).optional(),
  husbandContact: phoneOptionalSchema,
  hasChildren: z.boolean().default(false),
  children: z.array(childRowSchema).max(5).default([]),

  // Contact
  secondaryMobile: phoneOptionalSchema,
  personalEmail: emailOptionalSchema,
  emergencyContactName: z.string().min(1, "Emergency contact name required").max(120),
  emergencyContactNumber: phoneSchema,
  emergencyContactRelation: z.string().min(1, "Relation required").max(60),

  // Address
  localAddress: addressSchema,
  sameAsLocalAddress: z.boolean().default(true),
  permanentAddress: addressSchema.optional(),

  // Transport
  optedForTransport: z.boolean().default(false),
  busRoute: z.string().max(120).optional(),
  busStop: z.string().max(120).optional(),
}).refine(
  (d) => {
    // If category is SC/ST/OBC, subcaste + caste cert required
    if (d.category && ["SC", "ST", "OBC"].includes(d.category)) {
      return !!(d.subcaste && d.casteCertificateNumber);
    }
    return true;
  },
  { message: "Subcaste and caste certificate number required for SC/ST/OBC", path: ["subcaste"] }
).refine(
  (d) => {
    if (d.religion === "Other") return !!d.religionSpecify;
    return true;
  },
  { message: "Specify religion", path: ["religionSpecify"] }
).refine(
  (d) => {
    if (d.maritalStatus === "Married") return !!d.dateOfMarriage;
    return true;
  },
  { message: "Date of marriage required", path: ["dateOfMarriage"] }
).refine(
  (d) => {
    if (!d.sameAsLocalAddress) {
      return !!(d.permanentAddress?.line1 && d.permanentAddress?.cityVillage);
    }
    return true;
  },
  { message: "Permanent address required if different from local", path: ["permanentAddress"] }
).refine(
  (d) => {
    if (d.optedForTransport) return !!(d.busRoute && d.busStop);
    return true;
  },
  { message: "Bus route and stop required", path: ["busRoute"] }
);

// ─── Tab 3 — Professional ─────────────────────────────────────────────────────
export const staffTab3Schema = z.object({
  areaOfSpecialization: z.string().max(120).optional(),
  employmentType: z.enum(["Permanent", "Probation", "Contract", "Part-Time", "Guest", "Substitute"]).optional(),
  dateOfJoining: z.string().optional(),
});

// ─── Tab 4 — Education & Qualifications ───────────────────────────────────────
export const staffTab4Schema = z.object({
  education: z.array(educationRowSchema).min(1, "Add at least one qualification").max(10),
  certifications: z.array(certificationRowSchema).max(10).default([]),
});

// ─── Tab 5 — Experience ───────────────────────────────────────────────────────
export const staffTab5Schema = z.object({
  experience: z.array(experienceRowSchema).min(1, "Add at least one experience (or 'Fresher / First Job')").max(20),
  adminExperienceNote: z.string().max(500).optional(),
  assignmentsResponsibilities: z.string().max(500).optional(),
  coursesCurrentlyPursuing: z.string().max(500).optional(),
  leaveRequiredStudies: z.boolean().optional(),
}).refine(
  (d) => {
    if (d.coursesCurrentlyPursuing && d.coursesCurrentlyPursuing.trim().length > 0) {
      return d.leaveRequiredStudies !== undefined;
    }
    return true;
  },
  { message: "Specify if leave is required", path: ["leaveRequiredStudies"] }
);

// ─── Tab 6 — Payroll ──────────────────────────────────────────────────────────
export const staffTab6Schema = z.object({
  payScaleGrade: z.string().max(60).optional(),
  basicSalary: z.coerce.number().min(0).optional(),
  hra: z.coerce.number().min(0).optional(),
  da: z.coerce.number().min(0).optional(),
  specialAllowance: z.coerce.number().min(0).optional(),
  otherAllowance: z.coerce.number().min(0).optional(),
  grossSalary: z.coerce.number().min(0).optional(), // auto-computed, editable
  lastSalaryDrawn: z.coerce.number().min(0).optional(),
  lastSalaryYear: z
    .coerce.number()
    .int()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear())
    .optional(),
  modeOfLastSalaryPayment: z.enum(["Cash", "Bank"]).optional(),
  salaryCertificateUrl: z.string().optional(),
  minimumExpectedSalary: z.coerce.number().min(0).optional(),
  dateOfLastIncrement: z.string().optional(),
  ifSelectedJoiningDate: z.string().optional(),
}).refine(
  (d) => {
    if (d.lastSalaryDrawn && d.lastSalaryDrawn > 0) return !!d.salaryCertificateUrl;
    return true;
  },
  { message: "Salary certificate required if last salary drawn", path: ["salaryCertificateUrl"] }
);

// ─── Tab 7 — Statutory & Records ──────────────────────────────────────────────
export const staffTab7Schema = z.object({
  // Bank
  bankAccountNumber: z.string().max(40).optional(),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format").or(z.literal("")).optional(),
  bankName: z.string().max(120).optional(),
  bankBranch: z.string().max(120).optional(),
  bankPassbookUrl: z.string().optional(),

  // Statutory
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format").or(z.literal("")).optional(),
  panCardUrl: z.string().optional(),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits").or(z.literal("")).optional(),
  aadharNotAvailable: z.boolean().default(false),
  epfEnrolled: z.boolean().default(false),
  epfUan: z.string().max(40).optional(),
  esicNumber: z.string().max(40).optional(),
  gratuityEligible: z.boolean().default(false),
  tdsApplicable: z.boolean().default(false),

  // Disability
  disabilityType: z.enum(["None", "Locomotor", "Visual", "Hearing", "Other"]).default("None"),
  disabilitySpecification: z.string().max(200).optional(),
  disabilityPercentage: z.coerce.number().min(0).max(100).optional(),
  disabilityCertificateUrl: z.string().optional(),

  // Minority Details
  minorityCertificateReceived: z.boolean().optional(),
  minorityCertificateUrl: z.string().optional(),

  // References
  references: z.array(referenceRowSchema).min(2, "At least 2 references required").max(5),
}).refine(
  (d) => {
    if (d.bankAccountNumber && d.bankAccountNumber.length > 0) return !!d.ifscCode && d.ifscCode.length > 0;
    return true;
  },
  { message: "IFSC required if bank account filled", path: ["ifscCode"] }
).refine(
  (d) => {
    if (d.epfEnrolled) return !!(d.epfUan && d.esicNumber);
    return true;
  },
  { message: "EPF UAN and ESI number required when EPF enrolled", path: ["epfUan"] }
).refine(
  (d) => {
    if (d.disabilityType === "Other") return !!d.disabilitySpecification;
    return true;
  },
  { message: "Disability specification required", path: ["disabilitySpecification"] }
).refine(
  (d) => {
    if (d.disabilityType !== "None") return d.disabilityPercentage !== undefined;
    return true;
  },
  { message: "Disability percentage required", path: ["disabilityPercentage"] }
).refine(
  (d) => {
    // minority cert section appears only if minority=true; fields optional
    return true;
  },
  { message: "", path: [] }
);

// ─── Full merged staff form (7 tabs) ──────────────────────────────────────────
export const staffSchema = staffTab1Schema
  .merge(staffTab2Schema)
  .merge(staffTab3Schema)
  .merge(staffTab4Schema)
  .merge(staffTab5Schema)
  .merge(staffTab6Schema)
  .merge(staffTab7Schema);

export type StaffFormData = z.infer<typeof staffSchema>;
export type StaffTab1 = z.infer<typeof staffTab1Schema>;
export type StaffTab2 = z.infer<typeof staffTab2Schema>;
export type StaffTab3 = z.infer<typeof staffTab3Schema>;
export type StaffTab4 = z.infer<typeof staffTab4Schema>;
export type StaffTab5 = z.infer<typeof staffTab5Schema>;
export type StaffTab6 = z.infer<typeof staffTab6Schema>;
export type StaffTab7 = z.infer<typeof staffTab7Schema>;
export type EducationRow = z.infer<typeof educationRowSchema>;
export type CertificationRow = z.infer<typeof certificationRowSchema>;
export type ExperienceRow = z.infer<typeof experienceRowSchema>;
export type ChildRow = z.infer<typeof childRowSchema>;
export type ReferenceRow = z.infer<typeof referenceRowSchema>;
export type LanguageRow = z.infer<typeof languageRowSchema>;
export type Address = z.infer<typeof addressSchema>;

// Legacy alias for existing code compatibility
export const staffSchemaLegacy = z.object({
  firstName: upperString(1, 60, "First name is required"),
  lastName: upperString(1, 60, "Last name is required"),
  email: z.string().email("Valid email required"),
  mobile: phoneSchema,
  loginMobile: phoneSchema,
  staffId: z.string().min(1, "Staff ID required"),
  role: z.enum(["admin", "teacher"]),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
  employeeType: z.enum(["teaching", "non_teaching", "contract", "probation"]),
  gradeLevel: z.string().optional(),
  employmentType: z.string().optional(),
  gender: z.string().min(1, "Gender is required"),
  dob: z.string().min(1, "Date of birth is required"),
  nationality: z.string().optional(),
  race: z.string().optional(),
  religion: z.string().optional(),
  icPassport: z.string().optional(),
  address: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyContact: phoneOptionalSchema,
  qualification: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  institution: z.string().optional(),
  teachingSubjects: z.array(z.string()).optional(),
  certifications: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  epfNumber: z.string().optional(),
  socsoNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  isFormTeacher: z.boolean().optional(),
  isSubjectTeacher: z.boolean().optional(),
  status: z.enum(["active", "inactive", "on_leave", "suspended"]),
  joinDate: z.string().min(1, "Join date is required"),
});

export type StaffFormDataLegacy = z.infer<typeof staffSchemaLegacy>;

// ─── Session schema ────────────────────────────────────────────────────────────

export const sessionSchema = z.object({
  academic_year: z.string().min(1, "Academic year required"),
  classes: z.array(z.any()).min(1, "Add at least one class"),
});

// ─── SchoolPage (onboarding completed, edit mode) ────────────────────────────

export const schoolPageSchema = z.object({
  name: upperString(2, 120, "School name required"),
  acronym: upperString(1, 10, "Acronym required"),
  address: upperString(3, 255, "Address required"),
  city: upperString(1, 80, "City required"),
  state: z.string().min(1, "State required"),
  postal_code: z.string().min(3, "Postal code required").max(10),
  country: z.string().min(1, "Country required"),
  contact_phone: phoneSchema,
  contact_email: z.string().email("Invalid email"),
  board: z.string().min(1, "Board required"),
  school_type: z.string().min(1, "Type required"),
  principal_name: z.string().optional(),
  principal_email: z.string().email("Invalid email").optional().or(z.literal("")),
  principal_mobile: z.string().optional(),
  emblem_url: z.string().url().optional().or(z.literal("")),
});

export type SchoolPageForm = z.infer<typeof schoolPageSchema>;