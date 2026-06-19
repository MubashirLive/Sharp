---
description: Red-green-refactor TDD cycle for one task
---

# /tdd — Test-driven development for one task

Use for data hooks, RLS-adjacent code, business logic. Optional for UI.

Adapted from `superpowers:test-driven-development` (MIT).

## Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

If you wrote code before the test, delete the code. Start over.

## The cycle

For one task:

### 1. RED — write a failing test

Write a test that captures the desired behavior. Use Vitest + React Testing Library (already configured — see `src/test/setup.ts`).

```ts
import { describe, it, expect } from "vitest";
import { myNewFunction } from "@/lib/my-new-module";

describe("myNewFunction", () => {
  it("does X when Y", () => {
    expect(myNewFunction(Y)).toBe(X);
  });
});
```

### 2. Run the test — confirm it FAILS

```bash
npm test -- my-new-module
```

The test must fail. If it passes, either:
- The feature is already implemented (you don't need TDD for it)
- The test is wrong (it's testing implementation, not behavior)

### 3. GREEN — write minimum code to pass

Write the **simplest possible code** that makes the test pass. Nothing more. No extra features. No defensive code for impossible scenarios.

### 4. Run the test — confirm it PASSES

```bash
npm test -- my-new-module
```

### 5. REFACTOR — improve without changing behavior

Clean up names, extract helpers, dedupe. Run tests again to confirm nothing broke.

### 6. Commit

```bash
git add .
git commit -m "feat(scope): [what] + test"
```

## When to skip TDD (in SHARP)

- **UI pages and components** — TDD optional; visual review still required
- **Configuration** — type-check + manual smoke
- **One-line fixes** — judgement call
- **Prototype / spike code** — must be thrown away before merge

**TDD is mandatory for:**
- Data hooks / TanStack Query mutations
- Supabase query helpers
- RLS policy functions
- Form validation logic
- Multi-tenant filtering logic
- Business calculations (grades, attendance %, etc.)

## Anti-patterns

- Don't test implementation details (test behavior, not how)
- Don't mock the thing you're testing
- Don't write tests that pass without exercising the code
- Don't write multiple tests for one feature in a single commit
- Don't refactor while the test is red

## SHARP-specific test patterns

```ts
// Supabase mocks are pre-configured in src/test/setup.ts
import { vi, describe, it, expect } from "vitest";

// For testing a query helper
import { getStaffList } from "@/integrations/supabase/queries/staff";

describe("getStaffList", () => {
  it("filters by school_id", async () => {
    await getStaffList("school-123");
    expect(vi.mocked(supabase.from)).toHaveBeenCalledWith("staff");
    // Assert the .eq('school_id', 'school-123') call chain
  });
});
```

See `src/test/roleManagerTabs.test.tsx` and `src/test/autoAssignment.test.ts` for existing patterns.
