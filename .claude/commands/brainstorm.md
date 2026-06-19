---
description: Brainstorm a feature design before any code
---

# /brainstorm — Design a feature before any code

Use for any new feature, behavior change, or non-trivial component. Refuses to write code without a design spec.

Adapted from `superpowers:brainstorming` (MIT).

## Iron Law

**NO CODE WITHOUT A DESIGN SPEC.** If you start writing code, you've failed. Stop, save nothing, return to brainstorming.

## Output location

`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` where `<topic>` is a kebab-case short name.

## When to use

- New feature
- New page, dialog, or major component
- Behavior change to existing feature
- Cross-cutting concern (RLS change, new auth flow, new data shape)
- Anything the user would need to read `docs/PRD.md` to understand

Skip for:
- Bug fixes (use `systematic-debugging` from the plugin)
- Refactors (use `code-review` skill)
- One-line changes
- Tasks where the user has already provided a detailed spec

## The process

### 1. Understand the request

Ask clarifying questions. Don't assume. State your assumptions explicitly and let the user correct.

For each ambiguity, present 2-3 interpretations. Don't pick silently.

### 2. Explore the existing code

Use graph MCP tools first:
- `semantic_search_nodes` for the feature area
- `get_impact_radius` for blast-radius of the change
- `list_communities` to understand where the change fits

Read `docs/INDEX.md` → find the relevant feature doc → read it fully.

### 3. Push back if a simpler approach exists

If the user's request would be solved by an existing feature, say so.
If there's a much simpler version, propose it.
A senior engineer would not implement a 1000-line solution to a 100-line problem.

### 4. Write the design spec

Use the template below.

### 5. Self-review

Before showing the user, read your own spec with fresh eyes. Ask:
- "Would a senior engineer say this is overcomplicated?"
- "Did I avoid speculative features?"
- "Did I cover all the user's stated requirements?"
- "Did I miss any edge case the user mentioned?"

### 6. Show the user, get approval, then plan

Spec approved → run `/plan` to break it into tasks.

## Spec template

```markdown
# Design Spec — [feature name]

## Problem
[1-2 paragraphs: what the user is trying to do, what's hard about it today]

## Proposed solution
[High-level approach. 1 paragraph + optional ASCII diagram.]

## User-facing behavior
- [Bullet list of what the user sees/does]

## Data model
- [New tables / columns / RLS changes]
- [Existing tables that change]

## Components
- [New components to create, with file paths]
- [Existing components to modify]

## Permissions
- [Which roles can do what — reference docs/PERMISSION_MATRIX.md]

## Edge cases
- [Empty states, errors, race conditions, multi-tenant isolation]

## Out of scope
- [What we're explicitly NOT doing]

## Open questions
- [Things the spec doesn't decide yet — escalate to user]
```

## Anti-patterns

- Don't write the design in the chat — write it to a file
- Don't include code blocks in the spec (that's the plan's job)
- Don't design the data model twice (once here, once in the plan)
- Don't skip edge cases "to be decided later" — decide them now or escalate
