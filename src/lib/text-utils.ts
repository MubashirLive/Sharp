/**
 * Text normalization utilities for SHARP entities.
 * Ensures consistent casing across all user-input names.
 */

/**
 * Converts a string to Title Case.
 * "english" → "English"
 * "ADVANCED MATH" → "Advanced Math"
 * "mathEMATICS" → "Mathematics"
 */
export const toTitleCase = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  return str
    .toLowerCase()
    .replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
    )
    .trim();
};

/**
 * Converts a string to uppercase.
 * Used for codes, IDs, and reference numbers.
 * "abc123" → "ABC123"
 */
export const toUpperCase = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  return str.toUpperCase().trim();
};

/**
 * Title case that preserves Roman numerals in uppercase.
 * "Class III" → "Class III" (III stays uppercase)
 * "Section I" → "Section I"
 */
export const toTitleCasePreserveRoman = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  const romanNumerals = /\b(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\b/gi;
  return toTitleCase(str).replace(romanNumerals, (match) => match.toUpperCase());
};

/**
 * Sentence case — first word capitalized only.
 * "INVALID INPUT" → "Invalid input"
 */
export const toSentenceCase = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
