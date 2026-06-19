# Submit Guard

> Mandatory pattern for all mutation buttons. Added June 2026 after two production double-submit bugs in one week. Server replay via `idempotency_key` introduced in migration `20260604000000_idempotency_keys.sql`.

## Why

Two production bugs in June 2026:
1. **Staff "Next"** (`src/components/staff/StaffForm.tsx`) — no `disabled` prop. Two clicks created two staff IDs.
2. **Classes "Save"** (`src/components/onboarding/ClassesStep.tsx`) — `disabled={isSaving}` lags React commit by one render. Two rapid clicks inserted duplicate classes (2 → 4).

The `useRef` synchronous lock pattern was already used in `useClassesEditor.ts` — wasn't reused elsewhere.

## Client rules (mandatory)

1. Every Supabase mutation button **MUST** use `<SubmitButton>` from `@/components/ui/submit-button` **OR** `useGuardedSubmit()` from `@/hooks/useGuardedSubmit`.
2. `useState`-only `saving`/`isSubmitting`/`processing` flags without a `useRef` lock are **forbidden**.
3. React Query's `mutation.isPending` is acceptable (flips synchronously inside `mutate()`), but `<SubmitButton>` is preferred.

| Trigger shape | Use |
|---|---|
| One button → one async handler | `<SubmitButton onClick={fn}>` |
| Form `onSubmit`, dialog footer, `useImperativeHandle` | `useGuardedSubmit()` + manual `disabled` |
| RHF `handleSubmit` wrapping | `useGuardedSubmit()` wrapping the submit |
| React Query `mutate()` already in use | `disabled={mutation.isPending}` |

## Server rules (mandatory)

1. Every write edge function **MUST** require `idempotency_key` (UUID) in body.
2. Client generates UUID once per submission attempt, stores in `useRef`. Cleared only on success — failed attempt retains key for replay.
3. Server replays cached response on key reuse. **Do NOT cache 5xx** — must be retryable with fresh key.
4. Cached responses expire after 24h. Run `purge_expired_idempotency_keys()` nightly.

## Lint catch

ESLint rule `no-unprotected-async-click` flags `<Button onClick={async …}>` with no `disabled` prop. `<SubmitButton>` is excluded.

## Forbidden patterns

- `<Button onClick={asyncFn}>` with no `disabled` prop
- `<Button onClick={asyncFn} disabled={!form.formState.isValid}>` (validity ≠ in-flight)
- `setSaving(true); await mutate(); setSaving(false)` without `useRef` lock
- Edge function write path without `idempotency_key` lookup
- Generating new UUID per click instead of per submission attempt

## Correct pattern

```tsx
// src/components/staff/StaffForm.tsx
const { run: runNext, isPending: isGeneratingId } = useGuardedSubmit();
const idempotencyKeyRef = useRef<string | null>(null);

const handleNext = () => {
  if (activeSection === 1 && !staffId) {
    void runNext(async () => {
      if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
      const result = await createStaffAuthUser({ ..., idempotencyKey: idempotencyKeyRef.current });
      idempotencyKeyRef.current = null; // success → fresh key next time
    });
  }
};

return <SubmitButton onClick={handleNext} loadingLabel="Creating Staff ID…">Next</SubmitButton>;
```

## Origin

June 2026 — after second double-submit bug same week. Migration `20260604000000_idempotency_keys.sql` introduced server-side replay cache. Hook + wrapper: `useGuardedSubmit` and `<SubmitButton>`. Codified in `CLAUDE.md` Anti-Patterns.
