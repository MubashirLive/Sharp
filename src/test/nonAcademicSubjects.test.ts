import { describe, it, expect } from "vitest";
import {
  NON_ACADEMIC_SUBJECTS,
  isNonAcademicSubject,
} from "@/data/subjects";
import { toSectionSubjects } from "@/components/school/SubjectTab";

describe("Non-Academic Subjects", () => {
  it("includes all required default non-academic subjects", () => {
    const names = NON_ACADEMIC_SUBJECTS.map((s) => s.name);
    const expected = [
      "Swimming",
      "Dance",
      "Music",
      "Sports",
      "Mess",
      "Yoga",
      "Library",
      "Art and Craft",
      "Martial Arts",
      "Assembly",
      "Karate",
    ];

    for (const item of expected) {
      expect(names).toContain(item);
    }
  });

  it("identifies predefined non-academic subjects correctly and case-insensitively", () => {
    expect(isNonAcademicSubject({ name: "Swimming" })).toBe(true);
    expect(isNonAcademicSubject({ name: "dance" })).toBe(true);
    expect(isNonAcademicSubject({ name: "MUSIC" })).toBe(true);
    expect(isNonAcademicSubject({ name: "Sports" })).toBe(true);
    expect(isNonAcademicSubject({ name: "Mess" })).toBe(true);
    expect(isNonAcademicSubject({ name: "Yoga" })).toBe(true);
    expect(isNonAcademicSubject({ name: "Library" })).toBe(true);
    expect(isNonAcademicSubject({ name: "Art and Craft" })).toBe(true);
    expect(isNonAcademicSubject({ name: "Martial Arts" })).toBe(true);
    expect(isNonAcademicSubject({ name: "Assembly" })).toBe(true);
    expect(isNonAcademicSubject({ name: "Karate" })).toBe(true);
  });

  it("identifies custom non-academic subjects via isNonAcademic flag or NA_ prefix", () => {
    expect(isNonAcademicSubject({ name: "Robotics Club", isNonAcademic: true })).toBe(true);
    expect(isNonAcademicSubject({ name: "Pottery", code: "NA_POT" })).toBe(true);
    expect(isNonAcademicSubject({ name: "Zero Period", code: "NA_ZP" })).toBe(true);
  });

  it("returns false for standard academic subjects", () => {
    expect(isNonAcademicSubject({ name: "Mathematics", code: "MAT" })).toBe(false);
    expect(isNonAcademicSubject({ name: "Physics", code: "PHY" })).toBe(false);
    expect(isNonAcademicSubject({ name: "Chemistry", code: "CHEM" })).toBe(false);
    expect(isNonAcademicSubject({ name: "English", code: "ENG" })).toBe(false);
    expect(isNonAcademicSubject({ name: "Social Science", code: "SST" })).toBe(false);
  });

  it("toSectionSubjects correctly flags academic and non-academic items", () => {
    const rows = [
      { section_id: "sec-1", subject_name: "Mathematics", subject_code: "MAT", stream: null },
      { section_id: "sec-1", subject_name: "Swimming", subject_code: "SWM", stream: null },
      { section_id: "sec-1", subject_name: "Dance", subject_code: "DNC", stream: null },
      { section_id: "sec-1", subject_name: "Robotics", subject_code: "NA_ROB", stream: null },
      { section_id: "sec-1", subject_name: "French", subject_code: "FRE", stream: null },
    ];

    const result = toSectionSubjects(rows, "sec-1");

    const math = result.find((s) => s.name === "Mathematics")!;
    const swim = result.find((s) => s.name === "Swimming")!;
    const dance = result.find((s) => s.name === "Dance")!;
    const robotics = result.find((s) => s.name === "Robotics")!;
    const french = result.find((s) => s.name === "French")!;

    expect(math.isNonAcademic).toBe(false);
    expect(swim.isNonAcademic).toBe(true);
    expect(dance.isNonAcademic).toBe(true);
    expect(robotics.isNonAcademic).toBe(true);
    expect(french.isNonAcademic).toBe(false);
  });
});
