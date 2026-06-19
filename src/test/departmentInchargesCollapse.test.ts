// Pin the write shape of the department helpers after the
// 2026-06-19 collapse of department_incharges into department_staff.
//
// Before: addDepartmentMember inserted into BOTH department_staff and
// department_incharges; removeDepartmentIncharge deleted from
// department_incharges; getDepartmentsForStaff read both tables and
// union'd them.
//
// After: single-table read/write. department_staff now carries the
// is_incharge boolean. department_incharges table is dropped (per
// 20260619000000_collapse_department_incharges.sql).
//
// These tests don't care about the specific column names in the schema
// snapshot — they verify that the helper functions NO LONGER reference
// the department_incharges table.

import { describe, it, expect, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
  },
}));

vi.mock("@/integrations/supabase/queries/roleAudit", () => ({
  logRoleAudit: vi.fn().mockResolvedValue(undefined),
}));

import {
  addDepartmentMember,
  removeDepartmentMember,
  removeDepartmentIncharge,
  getDepartmentsForStaff,
} from "@/integrations/supabase/queries/roleAssignments";

// Build a fluent chainable builder where .from(table) returns a fresh
// chain per call. .select/.insert/.update/.delete returns `thenable` so
// awaiting the helper works. Each chain records the table it was bound
// to so the test can assert "this helper touched table X".
function makeChain(table: string) {
  const chain: any = {
    _table: table,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: undefined as undefined | ((onFulfilled: (v: { data: unknown; error: null }) => unknown) => unknown),
  };
  // Thenable — resolves to { data: [], error: null }
  chain.then = (onFulfilled: any) => Promise.resolve({ data: [], error: null }).then(onFulfilled);
  return chain;
}

beforeEach(() => {
  fromMock.mockReset();
  fromMock.mockImplementation((table: string) => makeChain(table));
});

describe("department helpers — collapse into department_staff (2026-06-19)", () => {
  it("addDepartmentMember writes only to department_staff", async () => {
    await addDepartmentMember("staff-A", "dept-1", "school-1", false, "user-X");
    const tables = fromMock.mock.calls.map((c) => c[0]);
    expect(tables).toContain("department_staff");
    expect(tables).not.toContain("department_incharges");
  });

  it("addDepartmentMember(asIncharge=true) sets is_incharge on the upsert", async () => {
    const chain = makeChain("department_staff");
    fromMock.mockImplementation(() => chain);
    await addDepartmentMember("staff-A", "dept-1", "school-1", true, "user-X");
    expect(chain.upsert).toHaveBeenCalledTimes(1);
    expect(chain.upsert.mock.calls[0][0]).toMatchObject({
      staff_profile_id: "staff-A",
      department_id: "dept-1",
      school_id: "school-1",
      is_incharge: true,
    });
  });

  it("removeDepartmentMember deletes only from department_staff", async () => {
    await removeDepartmentMember("staff-A", "dept-1", "school-1", "user-X");
    const tables = fromMock.mock.calls.map((c) => c[0]);
    expect(tables).toContain("department_staff");
    expect(tables).not.toContain("department_incharges");
  });

  it("removeDepartmentIncharge updates is_incharge=false (not deletes)", async () => {
    const chain = makeChain("department_staff");
    fromMock.mockImplementation(() => chain);
    await removeDepartmentIncharge("staff-A", "dept-1", "school-1", "user-X");
    expect(chain.update).toHaveBeenCalledTimes(1);
    expect(chain.update).toHaveBeenCalledWith({ is_incharge: false });
    expect(chain.delete).not.toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("staff_profile_id", "staff-A");
    expect(chain.eq).toHaveBeenCalledWith("department_id", "dept-1");
  });

  it("getDepartmentsForStaff reads only department_staff (single-table read)", async () => {
    const chain = makeChain("department_staff");
    // Simulate a row returned from the single-table read.
    chain.then = (onFulfilled: any) =>
      Promise.resolve({
        data: [{ id: "row-1", department_id: "dept-1", is_incharge: true, departments: { name: "Math" } }],
        error: null,
      }).then(onFulfilled);
    fromMock.mockImplementation(() => chain);

    const result = await getDepartmentsForStaff("staff-A", "school-1");
    const tables = fromMock.mock.calls.map((c) => c[0]);
    expect(tables).toEqual(["department_staff"]);
    expect(result).toEqual([
      { id: "row-1", department_id: "dept-1", department_name: "Math", is_incharge: true },
    ]);
  });
});