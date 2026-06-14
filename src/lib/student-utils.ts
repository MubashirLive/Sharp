/**
 * Student utilities — roll number building, age computation, class codes.
 * Keep in sync with supabase/migrations/20260508000002_roll_resequence_trigger.sql
 */

export const CLASS_CODE_MAP: Record<string, string> = {
  Nursery: 'N',
  LKG: 'L',
  UKG: 'U',
};

export const STREAM_CODE_MAP: Record<string, string> = {
  Science: 'S',
  Commerce: 'C',
  Arts: 'A',
};

/** Derive class code from class name: "Nursery"→"N", "Class 9"→"9", "UKG"→"U".
 *  If an explicit acronym is stored, use it instead. */
export function getClassCode(className: string, acronym?: string): string {
  if (acronym) return acronym;
  if (CLASS_CODE_MAP[className] !== undefined) return CLASS_CODE_MAP[className];
  const num = parseInt(className.replace(/\D/g, ''), 10);
  return num ? String(num) : className.slice(0, 2).toUpperCase();
}

/** Build the prefix portion of a roll number: classCode + streamCode? + section.
 *  Explicit classAcronym/sectionAcronym override derivation from names. */
export function buildRollPrefix(
  className: string,
  sectionName: string,
  stream?: string,
  classAcronym?: string,
  sectionAcronym?: string,
): string {
  const cc = getClassCode(className, classAcronym);
  const sc = stream ? STREAM_CODE_MAP[stream] ?? '' : '';
  const sectionCode = sectionAcronym ?? sectionName;
  return `${cc}${sc}${sectionCode}`;
}

/** Compute age in years from a DOB string (YYYY-MM-DD). Returns -1 if DOB is in the future. */
export function computeAge(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  if (birth > today) return -1;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Format age as a display string: "14 yrs" or "—" if invalid */
export function formatAge(dob: string): string {
  const age = computeAge(dob);
  if (age < 0) return '—';
  return `${age} yrs`;
}

/** Given a DOB, return age and a label suitable for display near DOB field */
export function ageLabel(dob: string): string {
  const age = computeAge(dob);
  if (age < 0) return 'DOB invalid';
  return `${age} yr${age !== 1 ? 's' : ''}`;
}

/** Auto-derive a 2-4 character class code from a class name.
 *  "Pre-Nursery" → "PR", "Class 10" → "10", "Nursery" → "N".
 *  Used as the initial value in the SessionStep acronym field. */
export function deriveClassAcronym(className: string): string {
  if (CLASS_CODE_MAP[className] !== undefined) return CLASS_CODE_MAP[className];
  const digits = className.replace(/\D/g, '');
  if (digits) return digits;
  // No digits → use first 2 uppercase letters
  const letters = className.replace(/[^a-zA-Z]/g, '');
  return letters.slice(0, 2).toUpperCase() || className.slice(0, 2).toUpperCase();
}
