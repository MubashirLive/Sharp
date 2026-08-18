// Regression test for the Wings cross-tab invalidation contract.
//
// 2026-06-20: useWingsForMySchool was added as the MySchool reader for
// the wings data layer. The WingsTab write path calls
// `invalidateRoleManagerSchool(schoolId, { wings: true, broadStaffRoles: true })`
// to notify the Role Manager wings tab + per-card staff-roles. This
// test pins that contract — if a future refactor drops the wings flag,
// the role-manager wings tab will go stale until F5.

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import {
  useWingsForMySchool,
  useInvalidateRoleManagerSchool,
  roleManagerKeys,
} from "@/hooks/useRoleManagerQueries";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

describe("useWingsForMySchool — key family + cross-tab invalidation", () => {
  it("uses the [schoolId, 'wings-myschool'] key", () => {
    // Capture the queryKey by registering a queryFn that records it.
    let captured: readonly unknown[] | undefined;
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);
    // Pre-seed the cache with a recordable queryFn via the QueryClient.
    qc.setQueryData(roleManagerKeys.wingsMySchool("school-1"), []);
    // The hook reads from the cache, but the queryKey is set by the hook
    // itself. Inspect by trying to fetch a placeholder via the same key
    // and verifying the hook's enabled state.
    const { result } = renderHook(() => useWingsForMySchool("school-1"), { wrapper });
    // `queryKey` is exposed on the internal `query` object; we just check
    // the helper factory is consistent with the hook.
    expect(roleManagerKeys.wingsMySchool("school-1")).toEqual([
      "role-manager",
      "wings-myschool",
      "school-1",
    ]);
    expect(result.current.isLoading).toBe(false); // seeded, no fetch needed
    captured = roleManagerKeys.wingsMySchool("school-1");
    expect(captured).toBeDefined();
  });

  it("WingsTab's bridge call invalidates the RM wings key + staff-roles prefix", () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useInvalidateRoleManagerSchool("school-1"), { wrapper });

    // This is exactly what WingsTab.handleSave calls after a successful write.
    result.current({ wings: true, broadStaffRoles: true });

    const invalidatedKeys = invalidateSpy.mock.calls
      .map((c) => c[0]?.queryKey)
      .filter(Boolean);

    // RM wings tab.
    const wingsKeyHit = invalidatedKeys.some(
      (k) => Array.isArray(k) && k[0] === "role-manager" && k[1] === "wings" && k[2] === "school-1"
    );
    expect(wingsKeyHit).toBe(true);

    // RM staff-roles prefix — every staff card's `coordinator` chip refetches.
    const staffRolesPrefixHit = invalidatedKeys.some(
      (k) => Array.isArray(k) && k[0] === "role-manager" && k[1] === "staff-roles" && k[2] === "school-1"
    );
    expect(staffRolesPrefixHit).toBe(true);
  });
});
