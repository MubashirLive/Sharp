---
description: Reflect on the session and propose updates to CLAUDE.md and docs/LESSONS.md
---

# /reflect — Distill session lessons into the project's living memory

Use this at the end of any substantial session (multi-file change, new feature, bug fix, or new convention discovered).

## What this command does

1. **Reads** current state of:
   - `CLAUDE.md` (project root)
   - `docs/LESSONS.md`
   - `MEMORY.md` (auto-memory)
   - `docs/INDEX.md` (for doc-first routing context)

2. **Reviews** what happened this session. Asks the user 1 question only if needed:
   - "What is the single most important thing to remember from this session?"

3. **Proposes TWO diffs** and shows them to the user:

   **A. `docs/LESSONS.md` — append 1-5 lessons** (one per insight):
   ```
   ## YYYY-MM-DD — [slug]

   **Rule:** [one sentence]
   **Why:** [bug or wasted time this prevents]
   **Example:** [optional — one short snippet]
   **Applies to:** [ui | rls | queries | forms | planning | subagents | docs]
   ```

   **B. `CLAUDE.md` — only if a NEW universal rule emerged** that applies to every future session:
   - A new anti-pattern that bit us hard
   - A new mandatory skill/plugin trigger
   - A new hard rule (e.g. "always do X before Y")
   - **DO NOT** propose CLAUDE.md edits for one-off project facts, doc updates, or feature-specific rules (those go in `docs/LESSONS.md` or feature docs).

4. **Writes the diffs** after user approval. Auto-approve mode only if the user said `/reflect --auto`.

## Decision rules — which file?

| Insight type | Goes in |
|---|---|
| Universal LLM-craft rule (always-applies) | `CLAUDE.md` |
| Project-wide convention (this app only) | `docs/LESSONS.md` |
| Feature-specific decision | `docs/{FEATURE}.md` or `MEMORY.md` decisions |
| One-time bug fix | git commit message only |
| Stale doc or wrong ref | `docs/LESSONS.md` "Anti-pattern" + fix in place |

## Example output

```
=== docs/LESSONS.md (append) ===
## 2026-06-18 — Auto-save guard must be inside the form, not the parent

**Rule:** UseGuardedSubmit must live inside the form component, not in
the parent that mounts it.
**Why:** Parent-level guard intercepts ALL buttons in the tab; nested
cancel buttons trigger submit-guard prompts.
**Applies to:** forms

=== CLAUDE.md (no change) ===
No new universal rule emerged this session.
```

## Anti-patterns for /reflect

- **Don't** pad `CLAUDE.md` with project-specific facts. The file should stay ~250 lines; it gets reread every session.
- **Don't** duplicate entries between `docs/LESSONS.md` and `CLAUDE.md`.
- **Don't** edit `MEMORY.md` from /reflect — that's `memory-save` command's job.
- **Don't** propose lessons for things that worked correctly the first time.
- **Don't** write lessons for trivial bug fixes (a one-line fix is not a rule).

## Compact mode (default)

Default: show diffs, ask once, write. No verbose explanation of what /reflect is doing.

## Auto mode

`/reflect --auto`: skip the question, infer from the session transcript, write directly. Use only when you've already mentally debriefed the session.
