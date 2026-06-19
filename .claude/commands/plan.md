---
description: Write a 2-5 minute step plan for a multi-step task
---

# /plan — Write an implementation plan

Use after `/brainstorm` produces a design spec, before any code is written.

Adapted from `superpowers:writing-plans` (MIT).

## When to use

- Multi-step task (≥2 files, or ≥1 hour of work)
- Spec is agreed but execution is non-trivial
- Multiple tasks that can be executed independently (else just do them inline)

## Output location

`docs/superpowers/plans/YYYY-MM-DD-<slug>.md` where `<slug>` is a kebab-case short name.

## Plan format

```markdown
# Plan — [feature name]

## Context
[Why this is being done, the problem it solves, 1-2 paragraphs]

## Goal
[One sentence: the verifiable end state]

## Tasks

Each task is 2-5 minutes of work. Full code blocks where useful.

### Task 1: [name]
- File(s): `src/...`
- Action: [exact change]
- Code: [paste full code block if non-obvious]
- Verify: [exact command to run, expected output]

### Task 2: [name]
...

## Verification
[End-to-end test: how to confirm the whole feature works]

## Out of scope
[What we're explicitly NOT doing]
```

## Iron Laws

- **No placeholders.** Every step has a real file path, real code, real verification.
- **No "TBD" or "fill in later".** If you don't know, ask the user or stop.
- **No "and then..." chains** that hide complexity. Each task is independently verifiable.
- **Tasks are 2-5 minutes.** Not 30 seconds (too small) and not 30 minutes (too big). Split big tasks.

## For SHARP

Always include in Context:
- "Filter by `school_id` on every multi-tenant query"
- "Use `academic_sessions` not `public.sessions`"
- "Reuse `src/components/` before creating new"
- "Reference `docs/INDEX.md` to find the feature doc for the area being touched"

For multi-task plans, also include the subagent-driven workflow:
- Mention `src/agents/implementer-prompt.md`, `src/agents/spec-reviewer-prompt.md`, `src/agents/code-quality-reviewer-prompt.md` are the templates for parallel execution
- For TDD-mandatory work, note per-task: "(TDD: write test first)"

## Example

See `docs/superpowers/plans/2026-06-17-wing-tab-cache-invalidation.md` for a real example.

## After writing the plan

1. Show the plan to the user
2. Get approval
3. Then either:
   - Run `/finish` chain: implement each task in current session, OR
   - Use subagents via `src/agents/implementer-prompt.md` for parallel execution
