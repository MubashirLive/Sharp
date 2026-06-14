# Submit Guard — Mandatory pattern for all mutation buttons

## Why

Two production bugs in June 2026 were caused by `useState`-disabled buttons:

1. **Staff "Next"** (`src/components/staff/StaffForm.tsx`) — no `disabled` prop at all. Clicking Next during staff creation fired `createStaffAuthUser()` twice and created two staff IDs.
2. **Classes "Save"** (`src/components/onboarding/ClassesStep.tsx`) — `disabled={isSaving}` but the state-driven `disabled` prop lags React's commit by one render. Two rapid clicks both passed the check and inserted the same draft classes twice — 2 classes became 4.

The same `useRef` synchronous lock pattern was already implemented in `useClassesEditor.ts` to fix a previous bug — it just wasn't reused.

## Client rules (mandatory)

1. Every button that triggers a Supabase mutation **MUST** use `<SubmitButton>` from `@/components/ui/submit-button` **OR** `useGuardedSubmit()` from `@/hooks/useGuardedSubmit`.
2. `useState`-only `saving` / `isSubmitting` / `processing` flags without a `useRef` lock are **forbidden** for mutation handlers.
3. React Query's `mutation.isPending` is acceptable (it flips synchronously inside `mutate()`), but `<SubmitButton>` is preferred for consistency.

### Which primitive to use

| Trigger shape | Use |
|---|---|
| One button → one async handler | `<SubmitButton onClick={fn}>` |
| Form `onSubmit`, dialog footer Buttons, imperative handle from `useImperativeHandle` | `useGuardedSubmit()` + manual `disabled` wiring |
| RHF `handleSubmit` wrapping | `useGuardedSubmit()` (wrap the submit function) |
| React Query `mutate()` already in use | Leave `disabled={mutation.isPending}` (synchronous flip) |

## Server rules (mandatory)

1. Every write edge function **MUST** require `idempotency_key` (UUID) in the request body.
2. The client generates the UUID **once per submission attempt** and stores it in a `useRef`. The key is **cleared only on success** — a failed attempt retains the same key so the next attempt replays any cached response.
3. The server replays the cached response on key reuse. **Do NOT cache 5xx responses** — they must be retryable with a fresh key.
4. Cached responses expire after 24 hours (configurable in the migration). Run `purge_expired_idempotency_keys()` nightly.

## What the lint catches

ESLint custom rule `no-unprotected-async-click` (warn, then error after the project-wide migration): flags `<Button onClick={async …}>` with no `disabled` prop. `<SubmitButton>` is excluded (it guards itself).

## Forbidden patterns

- `<Button onClick={asyncFn}>` with no `disabled` prop
- `<Button onClick={asyncFn} disabled={!form.formState.isValid}>` (form validity ≠ in-flight)
- `setSaving(true); await mutate(); setSaving(false)` without a `useRef` lock
- Edge function write path without `idempotency_key` lookup
- Generating a new UUID per click instead of per submission attempt

## Worked example — correct pattern

```tsx
// In src/components/staff/StaffForm.tsx
const { run: runNext, isPending: isGeneratingId } = useGuardedSubmit();
const idempotencyKeyRef = useRef<string | null>(null);

const handleNext = () => {
  if (activeSection === 1 && !staffId) {
    void runNext(async () => {
      if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
      const result = await createStaffAuthUser({ ..., idempotencyKey: idempotencyKeyRef.current });
      // success → clear so future re-attempt gets a fresh key
      idempotencyKeyRef.current = null;
    });
  }
};

return <SubmitButton onClick={handleNext} loadingLabel="Creating Staff ID…">Next</SubmitButton>;
```

## When this rule was added

June 2026 — after the second double-submit bug in the same week. Migration `20260604000000_idempotency_keys.sql` introduced the server-side replay cache. Hook + wrapper introduced as `useGuardedSubmit` and `<SubmitButton>`. Officially documented in this file and codified in `CLAUDE.md` Anti-Patterns.
