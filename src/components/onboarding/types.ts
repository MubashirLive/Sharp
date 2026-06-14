export interface ShiftDraft {
  name: string;
  start_time: string;
  end_time: string;
}

export interface HouseDraft {
  name: string;
  color: string;
  emblem_url?: string;
}

export interface SchoolStepData {
  name: string;
  acronym: string;
  address: string;
  postal_code: string;
  city: string;
  state: string;
  country: string;
  contact_phone: string;
  alt_contact_phone: string;
  contact_email: string;
  website: string;
  board: string;
  state_board_name: string;
  school_type: string;
  shifts: ShiftDraft[];
  houses: HouseDraft[];
  departments: string[];
  emblem_url: string;
  principal_email?: string;
  principal_mobile?: string;
  principal_name?: string;
}

export interface SectionDraft {
  _id?: string;
  _deleted?: boolean;
  name: string;
  stream?: string;
  acronym?: string;
  subjects: SubjectDraft[];
  subjectTeachers?: TeacherAssignment[];
  classTeacher?: ClassTeacherAssignment;
}

export interface SubjectDraft {
  name: string;
  code: string;
  stream?: string;
}

export interface ClassDraft {
  _id?: string;
  _deleted?: boolean;
  name: string;
  acronym: string;
  wing?: string;
  wing_id?: string;
  term_structure: string;
  start_date: string;
  end_date: string;
  sections: SectionDraft[];
}

export interface SessionStepData {
  academic_year: string;
  classes: ClassDraft[];
  wings: string[];
}

export interface TeacherAssignment {
  staff_profile_id: string;
  staff_name?: string;
  subject_name: string;
  subject_code?: string;
}

export interface ClassTeacherAssignment {
  staff_profile_id: string;
  staff_name?: string;
}

export interface WizardData {
  school: SchoolStepData;
  session: SessionStepData;
}