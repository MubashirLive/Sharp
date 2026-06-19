---
description: Close a development branch — merge, PR, keep, or discard
---

# /finish — Close a development branch

Use at the end of a feature, after all tasks are done and reviewed.

Adapted from `superpowers:finishing-a-development-branch` (MIT).

## Step 1 — Detect environment

```bash
git rev-parse --show-toplevel
git worktree list
git status
git log --oneline -5
```

Classify the env:
- **Worktree** (you see `.worktrees/...` in the path) — worktree-specific merge flow
- **Main repo on feature branch** — local merge flow
- **Detached HEAD** — no commit point; user must decide

## Step 2 — Run verification

**Before offering merge options**, run:
- `npm test` (or appropriate test command)
- `npm run type-check` (TypeScript projects)
- `npm run lint` (if configured)

If anything fails, report and stop. Do not offer to merge failing work.

## Step 3 — Present 4-option menu

```
Feature complete. What do you want to do?

1. Merge into main (and delete feature branch)
2. Create PR and stop here
3. Keep feature branch as-is (don't merge)
4. Discard all work in this branch
```

**Default: option 2 (create PR).** Safer for shared repos.

## Step 4 — Execute the chosen option

**Option 1 (merge):**
- `git checkout main`
- `git merge --no-ff [feature-branch]`
- `git branch -d [feature-branch]`
- If in worktree: `cd ../../ && git worktree remove .worktrees/[name]`

**Option 2 (PR):**
- `git push -u origin [feature-branch]`
- Detect remote: `gh` CLI available? → `gh pr create` with title + body
- Otherwise: print push command + manual PR URL

**Option 3 (keep):**
- Do nothing. Print: "Branch [name] kept at [commit-sha]."

**Option 4 (discard):**
- Confirm with user (destructive).
- `git checkout main && git branch -D [feature-branch]`
- If in worktree: remove worktree.

## Step 5 — Hand off to /reflect

After merge/PR, suggest running `/reflect` to capture session lessons.

## Anti-patterns

- Never merge failing tests.
- Never force-push to main.
- Never discard without explicit confirmation.
- Never skip the verification step "because the user just wants to merge."
