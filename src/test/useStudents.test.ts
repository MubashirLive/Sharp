// Tests for the Students page data hooks.
//
// Pins the contracts that the page relies on:
//   1. useStudents query key is the cross-surface canonical key for the
//      students list (matches the shared key in any other student reader).
//   2. useStudents filters by school_id on every query — RLS contract.
//   3. useCreateStudent on success invalidates the canonical students list
//      so the page refetches (and so the count chips refresh).
//   4. useBulkImportStudents invalidates the same key.
//
// See docs/LESSONS.md 2026-06-18 "two-store" entry for the shared-key
// invalidation rule this test pins.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { supabase } from "@/integrations/supabase/client";

// Stub the Supabase client chain the way src/test/setup.ts would — but
// the default mock there resolves to `data: null, error: null`. We need
// to inject a chainable mock that records the .eq() calls so we can
// assert the school_id filter. The per-test factory below overrides the
// default `from` for the duration of the test.
type CallRecord = { table: string; filters: Array<[string, unknown]>; data: any[] };

const fromMockState: {
  // One record per `from()` call, in order. The students query uses
  // Promise.all so we have to scan all records, not just the last.
  calls: CallRecord[];
  // What the test wants returned for the next `from(table).select()...` chain.
  // Map of table → rows to return. If a table isn't in the map, returns [].
  tableRows: Record<string, any[]>;
  insertRows: any[];
  shouldError: boolean;
  errorMsg: string | null;
} = {
  calls: [],
  tableRows: {},
  insertRows: [],
  shouldError: false,
  errorMsg: null,
};

function makeFromMock() {
  return (table: string) => {
    const record: CallRecord = { table, filters: [], data: [] };
    const chain: any = {
      _record: record,
      select: vi.fn(() => chain),
      eq: vi.fn((col: string, val: unknown) => {
        record.filters.push([col, val]);
        return chain;
      }),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      insert: vi.fn((rows: any) => {
        const arr = Array.isArray(rows) ? rows : [rows];
        fromMockState.insertRows.push(...arr);
        // .insert(...).select(...).single() or .insert(...).select()
        return chain;
      }),
      maybeSingle: vi.fn(async () => ({
        data: null,
        error: null,
      })),
      single: vi.fn(async () => {
        const err = fromMockState.shouldError
          ? { message: fromMockState.errorMsg ?? "boom" }
          : null;
        return { data: fromMockState.insertRows[0] ?? null, error: err };
      }),
      then: undefined, // not a real promise
    };
    Object.defineProperty(chain, "then", {
      get() {
        return async (resolve: (v: any) => void) => {
          // The mock returns the *table-specific* row set, not a global one.
          record.data = fromMockState.tableRows[table] ?? [];
          fromMockState.calls.push(record);
          const err = fromMockState.shouldError
            ? { message: fromMockState.errorMsg ?? "boom" }
            : null;
          resolve({ data: record.data, error: err });
        };
      },
    });
    return chain;
  };
}

vi.mocked(supabase).from = makeFromMock() as any;

// Also stub sonner so any accidental toast call doesn't crash the test.
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import {
  useStudents,
  useCreateStudent,
  useBulkImportStudents,
  studentsKeys,
} from "@/integrations/supabase/queries/students";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

beforeEach(() => {
  fromMockState.calls = [];
  fromMockState.tableRows = {};
  fromMockState.insertRows = [];
  fromMockState.shouldError = false;
  fromMockState.errorMsg = null;
  // Re-install the mock factory — vi.resetModules() in between tests
  // restores the original `from` from src/test/setup.ts.
  vi.mocked(supabase).from = makeFromMock() as any;
});

describe("studentsKeys — query key factory", () => {
  it("list key is ['students', schoolId]", () => {
    expect(studentsKeys.list("school-1")).toEqual(["students", "school-1"]);
  });

  it("list key is identical for the same school (cache hit guarantee)", () => {
    expect(studentsKeys.list("school-1")).toEqual(studentsKeys.list("school-1"));
  });

  it("list keys differ across schools (multi-tenant isolation)", () => {
    expect(studentsKeys.list("school-1")).not.toEqual(studentsKeys.list("school-2"));
  });
});

describe("useStudents — school_id filter contract", () => {
  it("queries the 'students' table and filters by school_id", async () => {
    fromMockState.tableRows = {
      students: [
        { id: "s1", full_name: "Aarav", school_id: "school-1", class_id: "c1", section_id: "sec1", roll_no: "1" },
        { id: "s2", full_name: "Diya", school_id: "school-1", class_id: "c1", section_id: "sec1", roll_no: "2" },
      ],
    };

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useStudents("school-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const studentsCall = fromMockState.calls.find((c) => c.table === "students");
    expect(studentsCall).toBeDefined();
    const schoolFilter = studentsCall!.filters.find(([col]) => col === "school_id");
    expect(schoolFilter).toBeDefined();
    expect(schoolFilter![1]).toBe("school-1");
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].full_name).toBe("Aarav");
  });

  it("is disabled when schoolId is undefined", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useStudents(undefined), { wrapper });
    expect(result.current.isFetching).toBe(false);
  });
});

describe("useCreateStudent — invalidation contract", () => {
  it("on success invalidates the students list key for the school", async () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    qc.setQueryData(studentsKeys.list("school-1"), []);

    const { result } = renderHook(() => useCreateStudent("school-1"), { wrapper });

    await result.current.mutateAsync({
      full_name: "Test Student",
      class_id: "class-1",
      section_id: "section-1",
      roll_no: "1",
    });

    await waitFor(() => {
      const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
      const hit = keys.some(
        (k) => Array.isArray(k) && k[0] === "students" && k[1] === "school-1"
      );
      expect(hit).toBe(true);
    });
  });

  it("throws when schoolId is missing", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateStudent(undefined), { wrapper });

    await expect(
      result.current.mutateAsync({
        full_name: "Test",
        class_id: "c1",
        section_id: "s1",
        roll_no: "1",
      })
    ).rejects.toThrow(/schoolId required/);
  });
});

describe("useBulkImportStudents — invalidation contract", () => {
  it("on success invalidates the students list key for the school", async () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    qc.setQueryData(studentsKeys.list("school-1"), []);

    const { result } = renderHook(() => useBulkImportStudents("school-1"), { wrapper });

    await result.current.mutateAsync([
      { full_name: "Row 1", class_id: "c1", section_id: "s1", roll_no: "1" },
      { full_name: "Row 2", class_id: "c1", section_id: "s1", roll_no: "2" },
    ]);

    await waitFor(() => {
      const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
      const hit = keys.some(
        (k) => Array.isArray(k) && k[0] === "students" && k[1] === "school-1"
      );
      expect(hit).toBe(true);
    });
  });
});
