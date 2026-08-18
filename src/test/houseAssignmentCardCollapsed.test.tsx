// Tests for the redesigned collapsed block of HouseAssignmentCard
// (docs/superpowers/specs/2026-06-20-houses-horizontal-card.md).
//
// Verifies:
//   - header renders 3 inline icon counts (incharge / staff / students)
//   - per-wing list renders one row per wing, each with a stacked gender bar
//   - Total row renders house-wide M/F + teacher count
//   - empty-wings path renders fallback text
//
// We don't test the expanded state or any data hooks — those are
// independently covered by the role-manager integration tests.

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { HouseAssignmentCard } from "@/components/role-manager/HouseAssignmentCard";
import type { HouseWithStats } from "@/integrations/supabase/queries/houses";

const baseHouse: HouseWithStats = {
  definition: { name: "Red", color: "#ef4444", emblem_url: "", slot: 0 },
  stats: {
    totalStudents: 80,
    totalTeachers: 14,
    totalIncharges: 2,
    byGender: { studentsMale: 48, studentsFemale: 32, studentsOther: 0, teachersMale: 8, teachersFemale: 6, teachersOther: 0 },
    byWing: [
      { wingId: "w1", wingName: "A-Wing", students: 40, studentsMale: 24, studentsFemale: 16, teachers: 5, teachersMale: 3, teachersFemale: 2 },
      { wingId: "w2", wingName: "B-Wing", students: 25, studentsMale: 15, studentsFemale: 10, teachers: 5, teachersMale: 3, teachersFemale: 2 },
      { wingId: "w3", wingName: "C-Wing", students: 15, studentsMale: 9, studentsFemale: 6, teachers: 4, teachersMale: 2, teachersFemale: 2 },
    ],
  },
  incharges: [
    { staffId: "i1", fullName: "Aiko Tanaka", fatherName: undefined },
    { staffId: "i2", fullName: "Bjorn Holm", fatherName: undefined },
  ],
  staff: [
    { staffId: "s1", fullName: "Cara Liu", fatherName: undefined, gender: "female", isIncharge: false, wings: ["A-Wing"] },
    { staffId: "s2", fullName: "Dani Park", fatherName: undefined, gender: "male", isIncharge: false, wings: ["A-Wing"] },
    { staffId: "s3", fullName: "Eli Roy", fatherName: undefined, gender: "female", isIncharge: false, wings: ["B-Wing"] },
    { staffId: "s4", fullName: "Faye Ng", fatherName: undefined, gender: "male", isIncharge: false, wings: ["B-Wing"] },
    { staffId: "s5", fullName: "Gus Kim", fatherName: undefined, gender: "male", isIncharge: false, wings: ["C-Wing"] },
    { staffId: "s6", fullName: "Hana Wu", fatherName: undefined, gender: "female", isIncharge: false, wings: ["C-Wing"] },
  ],
};

const noop = () => {};

function renderCard(overrides?: Partial<HouseWithStats>) {
  return render(
    <HouseAssignmentCard
      house={{ ...baseHouse, ...overrides } as HouseWithStats}
      staffList={[]}
      canEdit={true}
      isOtherCardBeingEdited={false}
      isExpanded={false}
      onToggleExpanded={noop}
      onEditStateChange={noop}
      onDirtyChange={noop}
      onAttemptSave={noop}
      isSaving={false}
    />
  );
}

describe("HouseAssignmentCard — header inline icon counts", () => {
  it("renders all 3 inline icon counts with a combined aria-label", () => {
    renderCard();
    const group = screen.getByLabelText("2 incharges, 6 staff, 80 students in Red");
    expect(group).toBeInTheDocument();
  });

  it("renders the numeric values inside the header count group", () => {
    renderCard();
    const group = screen.getByLabelText("2 incharges, 6 staff, 80 students in Red");
    // Each count is rendered as text alongside its icon. Verify they are
    // present in the group (not duplicated somewhere else).
    expect(within(group).getByText("2")).toBeInTheDocument();
    expect(within(group).getByText("6")).toBeInTheDocument();
    expect(within(group).getByText("80")).toBeInTheDocument();
  });
});

describe("HouseAssignmentCard — per-wing breakdown", () => {
  it("renders one per-wing row per wing", () => {
    renderCard();
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    // 3 wing rows + 1 Total row
    expect(items).toHaveLength(4);
  });

  it("per-wing row shows wing name + M / F / T counts", () => {
    renderCard();
    const list = screen.getByRole("list");
    expect(within(list).getByText("A-Wing")).toBeInTheDocument();
    // Text spans are broken by a nested <span> for the teacher count, so use
    // a function matcher that walks the rendered text.
    expect(within(list).getByText((_, el) => el?.textContent === "M 24 · F 16 · T 5")).toBeInTheDocument();
    expect(within(list).getByText("B-Wing")).toBeInTheDocument();
    expect(within(list).getByText((_, el) => el?.textContent === "M 15 · F 10 · T 5")).toBeInTheDocument();
  });

  it("per-wing row includes a gender stacked bar with the right aria values", () => {
    renderCard();
    const bar = screen.getByLabelText("24 male, 16 female");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "40");
  });

  it("renders a Total row with house-wide M / F / T counts", () => {
    renderCard();
    const totalRow = screen.getByLabelText("House-wide total");
    expect(totalRow).toBeInTheDocument();
    expect(within(totalRow).getByText("Total")).toBeInTheDocument();
    expect(within(totalRow).getByText((_, el) => el?.textContent === "M 48 · F 32 · T 14")).toBeInTheDocument();
  });

  it("Total row gender bar reflects house-wide totals", () => {
    renderCard();
    const totalRow = screen.getByLabelText("House-wide total");
    const bar = within(totalRow).getByLabelText("48 male, 32 female");
    expect(bar).toHaveAttribute("aria-valuenow", "80");
  });

  it("renders fallback text when the house has no wings", () => {
    renderCard({ stats: { ...baseHouse.stats, byWing: [] } });
    expect(screen.getByText("No wings defined for this house.")).toBeInTheDocument();
  });

  it("zero incharge count still renders inline in the header", () => {
    renderCard({ incharges: [] });
    expect(screen.getByLabelText("0 incharges, 6 staff, 80 students in Red")).toBeInTheDocument();
  });

  it("gender bar handles a wing with zero students gracefully", () => {
    const zeroWingStats = {
      ...baseHouse.stats,
      byWing: [
        { wingId: "w1", wingName: "A-Wing", students: 40, studentsMale: 24, studentsFemale: 16, teachers: 5, teachersMale: 3, teachersFemale: 2 },
        { wingId: "w2", wingName: "Empty-Wing", students: 0, studentsMale: 0, studentsFemale: 0, teachers: 0, teachersMale: 0, teachersFemale: 0 },
      ],
    };
    renderCard({ stats: zeroWingStats });
    const bar = screen.getByLabelText("0 male, 0 female");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "0");
  });
});
