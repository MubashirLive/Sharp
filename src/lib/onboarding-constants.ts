export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
] as const;

export const ACADEMIC_BOARDS = ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"] as const;
export const SCHOOL_TYPES = ["Private", "Public", "International", "Other"] as const;
export const ACADEMIC_YEARS = ["2024-25", "2025-26", "2026-27", "2027-28"] as const;
export const TERM_STRUCTURES = [
  "Annual",
  "Semester 1 & 2",
  "Semester 1, 2 & 3",
] as const;

export const DEFAULT_CLASSES = [
  "Nursery","LKG","UKG",
  "Class 1","Class 2","Class 3","Class 4","Class 5",
  "Class 6","Class 7","Class 8",
  "Class 9","Class 10",
  "Class 11","Class 12",
];

// Academic year → Jan 1 to Dec 31 of following year
export const ACADEMIC_YEAR_DATES: Record<string, { start: string; end: string }> = {
  "2024-25": { start: "2024-01-01", end: "2025-12-31" },
  "2025-26": { start: "2025-01-01", end: "2026-12-31" },
  "2026-27": { start: "2026-01-01", end: "2027-12-31" },
  "2027-28": { start: "2027-01-01", end: "2028-12-31" },
};

// Default term structure by class level
export function getDefaultTermStructure(className: string): string {
  const lower = className.toLowerCase();
  const isPrimary =
    lower === "nursery" ||
    lower === "lkg" ||
    lower === "ukg" ||
    ["class 1","class 2","class 3","class 4","class 5"].includes(lower);
  const isSenior =
    lower === "class 11" || lower === "class 12";
  if (isPrimary) return "Semester 1, 2 & 3";
  if (isSenior) return "Annual";
  return "Semester 1 & 2";
}

export const SUBJECT_CODE_MAP: Record<string, string> = {
  mathematics: "MAT", maths: "MAT", math: "MAT",
  science: "SCI", physics: "PHY", chemistry: "CHE", biology: "BIO",
  english: "ENG", hindi: "HIN", sanskrit: "SAN",
  "social science": "SST", history: "HIS", geography: "GEO", civics: "CIV",
  "computer science": "CSC", computers: "CSC",
  economics: "ECO", "physical education": "PED", art: "ART", music: "MUS",
};

export function generateSubjectCode(name: string, existingCodes: string[]): string {
  const lower = name.toLowerCase().trim();
  const prefix =
    SUBJECT_CODE_MAP[lower] ??
    lower.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  let n = 101;
  while (existingCodes.includes(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

// Canonical class order for sorting
const CLASS_ORDER: Record<string, number> = {
  "nursery": 0,
  "lkg": 1,
  "ukg": 2,
  "class 1": 3,
  "class 2": 4,
  "class 3": 5,
  "class 4": 6,
  "class 5": 7,
  "class 6": 8,
  "class 7": 9,
  "class 8": 10,
  "class 9": 11,
  "class 10": 12,
  "class 11": 13,
  "class 12": 14,
};

export function sortClasses<T extends { name: string }>(classes: T[]): T[] {
  return [...classes].sort((a, b) => {
    const aOrder = CLASS_ORDER[a.name.toLowerCase()] ?? 999;
    const bOrder = CLASS_ORDER[b.name.toLowerCase()] ?? 999;
    return aOrder - bOrder;
  });
}