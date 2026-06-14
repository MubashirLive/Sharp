// Pre-defined subject library by class level/category
// Used in Subject Tab for bucket selector UX

export interface SubjectItem {
  name: string;
  code: string;
}

export type StreamType = "science" | "commerce" | "arts" | "bifocal";

export const SUBJECTS_BY_CATEGORY: Record<string, SubjectItem[]> = {
  primary: [
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
    { name: "Mathematics", code: "MAT" },
    { name: "EVS", code: "EVS" },
    { name: "General Knowledge", code: "GK" },
    { name: "Art & Craft", code: "ART" },
    { name: "Computer", code: "COM" },
    { name: "Music", code: "MUS" },
  ],
  middle: [
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
    { name: "Mathematics", code: "MAT" },
    { name: "Science", code: "SCI" },
    { name: "Social Science", code: "SST" },
    { name: "Sanskrit", code: "SAN" },
    { name: "Computer", code: "COM" },
  ],
  secondary: [
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
    { name: "Mathematics", code: "MAT" },
    { name: "Science", code: "SCI" },
    { name: "Social Science", code: "SST" },
    { name: "Sanskrit", code: "SAN" },
    { name: "Computer", code: "COM" },
    { name: "Physical Education", code: "PE" },
  ],
  science: [
    { name: "Physics", code: "PHY" },
    { name: "Chemistry", code: "CHEM" },
    { name: "Biology", code: "BIO" },
    { name: "Mathematics", code: "MAT" },
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
    { name: "Physical Education", code: "PE" },
  ],
  commerce: [
    { name: "Accountancy", code: "ACC" },
    { name: "Economics", code: "ECO" },
    { name: "Business Studies", code: "BST" },
    { name: "Mathematics", code: "MAT" },
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
  ],
  arts: [
    { name: "History", code: "HIS" },
    { name: "Geography", code: "GEO" },
    { name: "Political Science", code: "POL" },
    { name: "Sociology", code: "SOC" },
    { name: "Psychology", code: "PSY" },
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
  ],
  bifocal: [
    { name: "Physics", code: "PHY" },
    { name: "Chemistry", code: "CHEM" },
    { name: "Mathematics", code: "MAT" },
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
    { name: "Computer Science", code: "CS" },
  ],
};

export const STREAMS: { value: StreamType; label: string }[] = [
  { value: "science", label: "Science" },
  { value: "commerce", label: "Commerce" },
  { value: "arts", label: "Arts" },
  { value: "bifocal", label: "Bifocal" },
];

// Class number to category mapping
export const getCategoryForClass = (className: string): string => {
  const lower = className.toLowerCase();

  if (["nursery", "lkg", "ukg"].some((c) => lower === c)) {
    return "primary";
  }

  const match = className.match(/\b(?:class\s*)?(\d{1,2})\b/);
  if (!match) return "middle";

  const classNumber = Number(match[1]);
  if (Number.isNaN(classNumber)) return "middle";

  if (classNumber >= 1 && classNumber <= 5) return "primary";
  if (classNumber >= 6 && classNumber <= 8) return "middle";
  if (classNumber >= 9 && classNumber <= 10) return "secondary";
  if (classNumber >= 11 && classNumber <= 12) return "senior";

  return "middle";
};

// Check if class is senior (11-12) needing stream selection
export const isSeniorClass = (className: string): boolean => {
  const match = className.match(/\b(?:class\s*)?(\d{1,2})\b/);
  if (!match) return false;
  const classNumber = Number(match[1]);
  return classNumber >= 11 && classNumber <= 12;
};

// Get subjects for a class, optionally filtered by stream
export const getSubjectsForClass = (
  className: string,
  stream?: StreamType
): SubjectItem[] => {
  const category = getCategoryForClass(className);

  if (category === "senior" && stream) {
    return SUBJECTS_BY_CATEGORY[stream] || [];
  }

  return SUBJECTS_BY_CATEGORY[category] || SUBJECTS_BY_CATEGORY.middle;
};

// Generate code for custom subject
export const generateSubjectCode = (name: string): string => {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
};

// Assigned subject type (stored in DB via section_subjects)
export interface AssignedSubject {
  name: string;
  code: string | null; // null for custom subjects
  stream?: string;
  isCustom?: boolean;
}