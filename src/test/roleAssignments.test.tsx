import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StaffRoleCard } from "@/components/role-manager/StaffRoleCard";
import * as roleAssignments from "@/integrations/supabase/queries/roleAssignments";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" }, role: "principal" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/integrations/supabase/queries/roleAssignments", async () => {
  const actual = await vi.importActual<any>("@/integrations/supabase/queries/roleAssignments");
  return {
    ...actual,
    getWingsForSchool: vi.fn().mockResolvedValue([{ id: "w1", name: "Primary" }]),
    getClassesForSchool: vi.fn().mockResolvedValue([{ id: "c1", name: "Class 1" }]),
    getSectionsForClass: vi.fn().mockResolvedValue([{ id: "sec1", name: "A" }]),
    getDepartmentsForSchool: vi.fn().mockResolvedValue([{ id: "d1", name: "Sports" }]),
    getHousesForSchool: vi.fn().mockResolvedValue([{ name: "Red", color: "#ef4444" }]),
    getCurrentAcademicYear: vi.fn().mockResolvedValue("ay1"),
    getClassTeacherConflict: vi.fn().mockResolvedValue(null),
    getStaffAllRoles: vi.fn().mockResolvedValue({
      staff_id: "s1",
      is_master_admin: false,
      is_admin: false,
      role: "teacher",
      status: "active",
      messenger_tag: "Staff",
      coordinator: null,
      class_teachers: [],
      subject_teachers: [],
      departments: [],
      house: null,
    }),
    updateStaffTag: vi.fn().mockResolvedValue(undefined),
    updateMasterAdmin: vi.fn().mockResolvedValue(undefined),
    updateAdminRole: vi.fn().mockResolvedValue(undefined),
    updateStaffRole: vi.fn().mockResolvedValue(undefined),
    updateStaffStatus: vi.fn().mockResolvedValue(undefined),
    addCoordinator: vi.fn().mockResolvedValue(undefined),
    removeCoordinator: vi.fn().mockResolvedValue(undefined),
    addClassTeacher: vi.fn().mockResolvedValue(undefined),
    removeClassTeacher: vi.fn().mockResolvedValue(undefined),
    addSubjectTeacher: vi.fn().mockResolvedValue(undefined),
    removeSubjectTeacher: vi.fn().mockResolvedValue(undefined),
    addDepartmentMember: vi.fn().mockResolvedValue(undefined),
    removeDepartmentMember: vi.fn().mockResolvedValue(undefined),
    removeDepartmentIncharge: vi.fn().mockResolvedValue(undefined),
    setHouse: vi.fn().mockResolvedValue(undefined),
  };
});

const baseStaff = {
  id: "s1",
  full_name: "Alice Sharma",
  employee_id: "EMP001",
  login_mobile: "9876543210",
  status: "active",
  school_id: "sc1",
};

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
    vi.mocked(roleAssignments.getStaffAllRoles).mockResolvedValueOnce({
      staff_id: "s1",
      is_master_admin: false,
      is_admin: false,
      role: "teacher",
      status: "active",
      messenger_tag: "Staff",
      coordinator: { id: "w1", wing_id: "w1", wing_name: "Primary Wing" },
      class_teachers: [],
      subject_teachers: [],
      departments: [
        { id: "d1", department_id: "d1", department_name: "Sports", is_incharge: true },
        { id: "d2", department_id: "d2", department_name: "Library", is_incharge: false },
        { id: "d3", department_id: "d3", department_name: "Accounts", is_incharge: false },
      ],
      house: null,
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
    // Incharge dept with crown
    expect(screen.getByText(/👑 Sports/)).toBeInTheDocument();
    // Member depts (no crown, no count)
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Accounts")).toBeInTheDocument();
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
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Wing")).toBeInTheDocument();
    expect(screen.getByText("Class Teacher")).toBeInTheDocument();
    expect(screen.getByText("Subject Teacher")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    // Department section now has Member + Incharge sub-dropdowns
    expect(screen.getByText("+ Add member")).toBeInTheDocument();
    expect(screen.getByText("+ Add incharge")).toBeInTheDocument();
    expect(screen.getByText("House")).toBeInTheDocument();
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
