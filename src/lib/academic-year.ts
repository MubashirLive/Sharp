/**
 * Auto-derive academic year from current system date.
 * Academic year: January to December.
 *
 * Examples:
 *   Date: May 2026 → "2026-27"
 *   Date: January 2026 → "2026-27"
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (month === 0) {
    // January — still in first half of academic year
    return `${year - 1}-${String(year).slice(-2)}`;
  }
  return `${year}-${String(year + 1).slice(-2)}`;
}

/**
 * Get the upcoming academic year (next year from current).
 * Use case: onboarding — offer user option to start with upcoming year.
 *
 * Examples:
 *   Date: May 2026 → "2027-28"
 *   Date: January 2026 → "2027-28"
 */
export function getUpcomingAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month === 0) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year + 1}-${String(year + 2).slice(-2)}`;
}

/**
 * Get academic year date range (start + end dates).
 * Format: Jan 1 of start year → Dec 31 of following year.
 */
export function getAcademicYearDates(academicYear: string): { start: string; end: string } {
  const [startYear] = academicYear.split("-").map((s) => parseInt(s, 10));
  return {
    start: `${startYear}-01-01`,
    end: `${startYear + 1}-12-31`,
  };
}