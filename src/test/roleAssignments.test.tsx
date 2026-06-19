import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StaffRoleCard } from "@/components/role-manager/StaffRoleCard";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" }, role: "principal" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Stub the TanStack Query hook layer. The card consumes `roles` via
// useStaffRoles; the tests previously mocked getStaffAllRoles directly
// (the old useState+useEffect path). Same shape, same fixtures.
vi.mock("@/hooks/useRoleManagerQueries", () => ({
  useStaffRoles: vi.fn(),
  useSaveStaffRoles: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false })),
  useStaffList: vi.fn(() => ({ data: [], isLoading: false, refetch: vi.fn() })),
  useRefreshStaffList: vi.fn(() => vi.fn()),
  roleManagerKeys: { all: ["role-manager"] },
}));

const defaultRoles = {
  staff_id: "s1",
  is_master_admin: false,
  is_admin: false,
  role: "teacher",
  status: "active",
  messenger_tag: "Staff",
  coordinator_wings: [],
  auto_assigned_wings: [],
  manual_teacher_wings: [],
  class_teachers: [],
  subject_teachers: [],
  departments: [],
  house: null,
};

vi.mock("@/integrations/supabase/queries/roleAssignments", async () => {
  const actual = await vi.importActual<any>("@/integrations/supabase/queries/roleAssignments");
  return {
    ...actual,
    getWingsForSchool: vi.fn().mockResolvedValue([{ id: "w1", name: "Primary" }]),
    getClassesForSchool: vi.fn().mockResolvedValue([{ id: "c1", name: "Class 1" }]),
    getSectionsForClass: vi.fn().mockResolvedValue([{ id: "sec1", name: "A" }]),
    getDepartmentsForSchool: vi.fn().mockResolvedValue([{ id: "d1", name: "Sports" }, { id: "d2", name: "Library" }]),
    getHousesForSchool: vi.fn().mockResolvedValue([{ name: "Red", color: "#ef4444" }]),
    getCurrentAcademicYear: vi.fn().mockResolvedValue("ay1"),
    getClassTeacherConflict: vi.fn().mockResolvedValue(null),
    getAutoAssignedWingsForStaff: vi.fn().mockResolvedValue([]),
  };
});

import { useStaffRoles } from "@/hooks/useRoleManagerQueries";

const baseStaff = {
  id: "s1",
  full_name: "Alice Sharma",
  employee_id: "EMP001",
  login_mobile: "9876543210",
  status: "active",
  school_id: "sc1",
};

beforeEach(() => {
  // Reset to the default fixture before each test. Individual tests
  // override with mockReturnValueOnce for the specific scenarios they
  // exercise (e.g. collapsed-card dept list, member+incharge dedup).
  vi.mocked(useStaffRoles).mockReturnValue({ data: defaultRoles, isLoading: false } as any);
});

describe("StaffRoleCard — view mode", () => {
  it("renders name, id, tag, status, edit button", async () => {
    render(
      <StaffRoleCard
        staff={baseStaff as any}
        schoolId="sc1"
        isOwnCard={false}
        canEdit={true}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />
    );
    await waitFor(() => expect(screen.getByText("Alice Sharma")).toBeInTheDocument());
    expect(screen.getByText(/EMP001/)).toBeInTheDocument();
    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("does not render edit button on own card", async () => {
    render(
      <StaffRoleCard
        staff={{ ...baseStaff, id: "u1" } as any}
        schoolId="sc1"
        isOwnCard={true}
        canEdit={true}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />
    );
    await waitFor(() => expect(screen.queryByTitle("Edit")).not.toBeInTheDocument());
  });

  it("does not render edit button when canEdit is false", async () => {
    render(
      <StaffRoleCard
        staff={baseStaff as any}
        schoolId="sc1"
        isOwnCard={false}
        canEdit={false}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />
    );
    await waitFor(() => expect(screen.queryByTitle("Edit")).not.toBeInTheDocument());
  });

  it("collapsed card shows all dept names with incharge crown", async () => {
    // Override the default mock for this test only
    vi.mocked(useStaffRoles).mockReturnValue({
      data: {
        staff_id: "s1",
        is_master_admin: false,
        is_admin: false,
        role: "teacher",
        status: "active",
        messenger_tag: "Staff",
        coordinator_wings: [{ id: "w1", wing_id: "w1", wing_name: "Primary Wing" }],
        auto_assigned_wings: [],
        manual_teacher_wings: [],
        class_teachers: [],
        subject_teachers: [],
        departments: [
          { id: "d1", department_id: "d1", department_name: "Sports", is_incharge: true },
          { id: "d2", department_id: "d2", department_name: "Library", is_incharge: false },
          { id: "d3", department_id: "d3", department_name: "Accounts", is_incharge: false },
        ],
        house: null,
      },
      isLoading: false,
    } as any);

    render(
      <StaffRoleCard
        staff={baseStaff as any}
        schoolId="sc1"
        isOwnCard={false}
        canEdit={true}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />
    );
    // Wing name shown
    await waitFor(() => expect(screen.getByText(/Primary Wing/)).toBeInTheDocument());
    // Incharge dept with crown + "— Incharge" label
    expect(screen.getByText(/👑 Sports — Incharge/)).toBeInTheDocument();
    // Member depts with "— Member" label
    expect(screen.getByText("Library — Member")).toBeInTheDocument();
    expect(screen.getByText("Accounts — Member")).toBeInTheDocument();
    // Should NOT show the old "2 depts" count chip
    expect(screen.queryByText(/2 depts/)).not.toBeInTheDocument();
  });
});

describe("StaffRoleCard — edit mode", () => {
  const enterEdit = async () => {
    render(
      <StaffRoleCard
        staff={baseStaff as any}
        schoolId="sc1"
        isOwnCard={false}
        canEdit={true}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />
    );
    await waitFor(() => screen.getByTitle("Edit"));
    fireEvent.click(screen.getByTitle("Edit"));
    await waitFor(() => screen.getByText("Cancel"));
  };

  it("enters edit mode and shows all sections", async () => {
    await enterEdit();
    expect(screen.getByText("Master Admin")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getAllByText("Role").length).toBeGreaterThanOrEqual(1);
    // Wing section split into Coordinator (manual) + Wings (auto) rows.
    expect(screen.getByText("Coordinator")).toBeInTheDocument();
    expect(screen.getByText("Wings")).toBeInTheDocument();
    expect(screen.getByText("Class Teacher")).toBeInTheDocument();
    expect(screen.getByText("Subject Teacher")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    // Department section now has Member + Incharge sub-dropdowns
    expect(screen.getByText("+ Add member")).toBeInTheDocument();
    expect(screen.getByText("+ Add incharge")).toBeInTheDocument();
    expect(screen.getByText("House")).toBeInTheDocument();
  });

  it("same dept as member + incharge renders only one badge (incharge wins)", async () => {
    // Override the mock so the staff already has Sports as incharge+member
    vi.mocked(useStaffRoles).mockReturnValue({
      data: {
        staff_id: "s1",
        is_master_admin: false,
        is_admin: false,
        role: "teacher",
        status: "active",
        messenger_tag: "Staff",
        coordinator_wings: [],
        auto_assigned_wings: [],
        manual_teacher_wings: [],
        class_teachers: [],
        subject_teachers: [],
        departments: [
          { id: "dd1", department_id: "d1", department_name: "Sports", is_incharge: true },
        ],
        house: null,
      },
      isLoading: false,
    } as any);

    render(
      <StaffRoleCard
        staff={baseStaff as any}
        schoolId="sc1"
        isOwnCard={false}
        canEdit={true}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const editBtn = await screen.findByTitle("Edit");
    fireEvent.click(editBtn);

    await waitFor(() => expect(screen.getByText(/Sports\s+—\s+Incharge/)).toBeInTheDocument());
    // Should NOT render a separate "Sports — Member" badge
    expect(screen.queryByText(/Sports\s+—\s+Member/)).not.toBeInTheDocument();
  });

  it("shows tag input pre-filled with current tag", async () => {
    await enterEdit();
    const tagInput = screen.getByDisplayValue("Staff") as HTMLInputElement;
    expect(tagInput).toBeInTheDocument();
  });

  it("Save button is disabled when not dirty", async () => {
    await enterEdit();
    const saveBtn = screen.getByText("Save").closest("button") as HTMLButtonElement;
    expect(saveBtn).toBeDisabled();
  });

  it("Save button enables after editing tag", async () => {
    await enterEdit();
    const tagInput = screen.getByDisplayValue("Staff");
    fireEvent.change(tagInput, { target: { value: "PGT English" } });
    await waitFor(() => {
      const saveBtn = screen.getByText("Save").closest("button") as HTMLButtonElement;
      expect(saveBtn).not.toBeDisabled();
    });
  });

  it("calls onDirtyChange when input changes", async () => {
    const onDirty = vi.fn();
    render(
      <StaffRoleCard
        staff={baseStaff as any}
        schoolId="sc1"
        isOwnCard={false}
        canEdit={true}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn().mockResolvedValue(undefined)}
        onDirtyChange={onDirty}
      />
    );
    await waitFor(() => screen.getByTitle("Edit"));
    fireEvent.click(screen.getByTitle("Edit"));
    await waitFor(() => screen.getByText("Cancel"));
    fireEvent.change(screen.getByDisplayValue("Staff"), { target: { value: "PGT" } });
    expect(onDirty).toHaveBeenCalledWith(true);
  });

  it("Cancel reverts draft state", async () => {
    await enterEdit();
    const tagInput = screen.getByDisplayValue("Staff") as HTMLInputElement;
    fireEvent.change(tagInput, { target: { value: "CHANGED" } });
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => screen.getByTitle("Edit"));
    expect(screen.getByText("Staff")).toBeInTheDocument();
  });

  it("Role is read-only (no Role select dropdown in edit mode)", async () => {
    await enterEdit();
    expect(screen.queryByText("teacher")).not.toBeInTheDocument();
    expect(screen.queryByText("non_teaching")).not.toBeInTheDocument();
    // The 'auto-derived' hint should be visible
    expect(screen.getByText("auto-derived")).toBeInTheDocument();
  });

  it("Master Admin toggle opens typed-name confirm dialog", async () => {
    await enterEdit();
    // Find the Master Admin Switch by role
    const switches = screen.getAllByRole("switch");
    // First switch is Master Admin (since Principal)
    const masterAdminSwitch = switches[0];
    fireEvent.click(masterAdminSwitch);
    await waitFor(() => expect(screen.getByText(/Type/)).toBeInTheDocument());
    // The placeholder shows the staff name (case may vary, just check it exists)
    expect(screen.getByPlaceholderText("Alice Sharma")).toBeInTheDocument();
  });

  it("Typed-name confirm: confirm button disabled until exact name typed", async () => {
    await enterEdit();
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[0]);
    await waitFor(() => screen.getByText(/Type/));
    const input = screen.getByPlaceholderText("Alice Sharma") as HTMLInputElement;
    const grantBtn = screen.getByText("Grant").closest("button") as HTMLButtonElement;
    // Empty input → disabled
    expect(grantBtn).toBeDisabled();
    // Partial → disabled
    fireEvent.change(input, { target: { value: "Alice" } });
    expect(grantBtn).toBeDisabled();
    // Wrong case → enabled (case-insensitive)
    fireEvent.change(input, { target: { value: "alice sharma" } });
    expect(grantBtn).not.toBeDisabled();
    // Exact match → enabled
    fireEvent.change(input, { target: { value: "Alice Sharma" } });
    expect(grantBtn).not.toBeDisabled();
    // Whitespace-padded → enabled
    fireEvent.change(input, { target: { value: "  Alice Sharma  " } });
    expect(grantBtn).not.toBeDisabled();
  });

  it("Admin switch disabled when Master Admin is on", async () => {
    await enterEdit();
    const switches = screen.getAllByRole("switch");
    // First is Master Admin, second is Admin
    fireEvent.click(switches[0]); // open confirm
    await waitFor(() => screen.getByText(/Type/));
    fireEvent.change(screen.getByPlaceholderText("Alice Sharma"), { target: { value: "Alice Sharma" } });
    fireEvent.click(screen.getByText("Grant"));
    await waitFor(() => screen.getByText(/disabled \(Master Admin covers\)/));
    // Admin switch should be disabled
    const adminSwitch = switches[1] as HTMLInputElement;
    expect(adminSwitch).toBeDisabled();
  });
});

// ============================================================================
// 2026-06-18: Manual teacher wings (Wings tab "Add Teacher" output) must
// render in the Staff card Wings section with a distinct visual (no Lock
// icon, blue accent) and a "remove via Wings tab" tooltip. Live case: Amit
// Verma added to Montessori via Wings tab was invisible on the Staff card
// because the card only read auto_assigned=true rows.
// ============================================================================

describe("StaffRoleCard — manual teacher wings (Wings tab add-teacher)", () => {
  const rolesWithManualTeacher = {
    ...defaultRoles,
    manual_teacher_wings: [{ id: "w-mont", name: "Montessori" }],
  };

  it("renders manual teacher wing chip in the Wings row of expanded card with blue accent and no Lock icon", async () => {
    vi.mocked(useStaffRoles).mockReturnValue({ data: rolesWithManualTeacher, isLoading: false } as any);

    render(
      <StaffRoleCard
        staff={baseStaff as any}
        schoolId="sc1"
        isOwnCard={false}
        canEdit={true}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn()}
      />
    );

    // Expand the card to reveal the drawer sections
    const expandBtn = screen.getByTitle("Expand");
    fireEvent.click(expandBtn);

    await waitFor(() => {
      // The chip renders both in the collapsed AcademicProfile AND the
      // expanded drawer — both share the same title. Use getAllByTitle.
      const chips = screen.getAllByTitle("Manual teacher assignment — remove via Wings tab");
      expect(chips.length).toBeGreaterThan(0);
    });

    const drawerChips = screen.getAllByTitle("Manual teacher assignment — remove via Wings tab");
    expect(drawerChips.length).toBeGreaterThan(0);
    const drawerChip = drawerChips[0];
    expect(drawerChip).toHaveTextContent("Montessori");

    // Visual: blue accent, no Lock icon inside the manual chip.
    expect(drawerChip.className).toContain("bg-blue-50");
    expect(drawerChip.className).toContain("text-blue-700");
    expect(drawerChip.querySelector("svg")).toBeNull();
  });

  it("renders manual teacher wing in the collapsed AcademicProfile (Wings sub-row) with blue accent", async () => {
    vi.mocked(useStaffRoles).mockReturnValue({ data: rolesWithManualTeacher, isLoading: false } as any);

    render(
      <StaffRoleCard
        staff={baseStaff as any}
        schoolId="sc1"
        isOwnCard={false}
        canEdit={true}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn()}
      />
    );

    // AcademicProfile is rendered in the collapsed (always-visible) section.
    // Find the manual-teacher chip — it must show "Montessori" with the
    // blue badge class set, no Lock icon.
    const chip = await screen.findByTitle("Manual teacher assignment — remove via Wings tab");
    expect(chip).toHaveTextContent("Montessori");
    expect(chip.className).toContain("bg-blue-50");
    expect(chip.querySelector("svg")).toBeNull();
  });

  it("manual teacher wing is suppressed when the staff is also a coordinator of that wing (coordinator wins)", async () => {
    const rolesOverlap = {
      ...defaultRoles,
      manual_teacher_wings: [{ id: "w-mont", name: "Montessori" }],
      coordinator_wings: [{ id: "w-mont", wing_id: "w-mont", wing_name: "Montessori" }],
    };
    vi.mocked(useStaffRoles).mockReturnValue({ data: rolesOverlap, isLoading: false } as any);

    render(
      <StaffRoleCard
        staff={baseStaff as any}
        schoolId="sc1"
        isOwnCard={false}
        canEdit={true}
        isPrincipal={true}
        isMasterAdmin={false}
        onRefresh={vi.fn()}
      />
    );

    // Coordinator section is present (purple chip with crown).
    expect(screen.getByText(/👑 Montessori/)).toBeInTheDocument();

    // The manual-teacher chip must NOT render — coordinator wins.
    expect(screen.queryByTitle("Manual teacher assignment — remove via Wings tab")).toBeNull();
  });
});
