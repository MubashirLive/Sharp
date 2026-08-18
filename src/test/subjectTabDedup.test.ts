// Regression test for the My School Subjects tab duplicate-subject bug.
//
// The section_subjects table had every (section_id, subject_name) pair stored
// twice. Duplicate rows became duplicate chips keyed by subject name in the
// edit modal, whose remove-by-name handler then misbehaved (dead X button,
// subjects "reappearing"). `toSectionSubjects` collapses duplicates by name so
// the UI can never receive duplicate keys, independent of the DB constraint.

import { describe, it, expect } from "vitest";

import { toSectionSubjects } from "@/components/school/SubjectTab";

const row = (
  section_id: string,
  subject_name: string,
  subject_code: string | null = null,
  stream: string | null = null
) => ({ section_id, subject_name, subject_code, stream });

describe("toSectionSubjects", () => {
  it("collapses duplicate (section, subject_name) rows into one entry", () => {
    const rows = [
      row("sec-1", "Mathematics", "MATH"),
      row("sec-1", "Mathematics", "MATH"), // exact duplicate
      row("sec-1", "Hindi", "HIN"),
    ];

    const result = toSectionSubjects(rows, "sec-1");

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.name).sort()).toEqual(["Hindi", "Mathematics"]);
  });

  it("only returns subjects for the requested section", () => {
    const rows = [
      row("sec-1", "Mathematics", "MATH"),
      row("sec-2", "Science", "SCI"),
    ];

    const result = toSectionSubjects(rows, "sec-1");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Mathematics");
  });

  it("marks code-less rows as custom and preserves code/stream", () => {
    const rows = [
      row("sec-1", "Mathematics", "MATH", "science"),
      row("sec-1", "Yoga", null),
    ];

    const result = toSectionSubjects(rows, "sec-1");

    const math = result.find((s) => s.name === "Mathematics")!;
    const yoga = result.find((s) => s.name === "Yoga")!;
    expect(math.code).toBe("MATH");
    expect(math.stream).toBe("science");
    expect(math.isCustom).toBe(false);
    expect(yoga.isCustom).toBe(true);
  });

  it("returns an empty array when the section has no subjects", () => {
    expect(toSectionSubjects([], "sec-1")).toEqual([]);
  });
});
