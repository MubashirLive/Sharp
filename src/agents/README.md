# Subagent Prompt Templates

> MIT-licensed copies from the `superpowers` Claude Code plugin v5.1.0.
> Copied 2026-06-18 so we own them and can edit without touching the plugin cache.
> Source paths noted in each file's frontmatter.

## When to use these

Use the **subagent-driven-development** workflow from `superpowers` for plans that:
- Have multiple independent tasks
- Stay in the same session (not parallel session)
- Will benefit from automatic review checkpoints

Skip for:
- Single-file fixes
- Trivial edits
- Coupled tasks that share state (use manual execution instead)

## The 3 templates

| Template | Purpose | When to dispatch |
|---|---|---|
| `implementer-prompt.md` | Run the actual task | First, per task |
| `spec-reviewer-prompt.md` | Verify implementer built what was asked (nothing more, nothing less) | After implementer reports DONE, per task |
| `code-quality-reviewer-prompt.md` | Verify code is well-built (clean, tested, maintainable) | After spec compliance ✅, per task |

The full orchestration is described in [superpowers:subagent-driven-development](https://github.com/superpowers). In short: **implementer → spec-reviewer → code-quality-reviewer**, looping until both reviewers approve. Then mark task done and move to next.

## Model selection (from superpowers)

| Task complexity | Model |
|---|---|
| 1-2 files, clear spec, mechanical | Fast/cheap (Haiku) |
| Multi-file, integration concerns | Standard (Sonnet) |
| Design judgment, broad codebase | Most capable (Opus) |

## Dispatching in Claude Code

Use the `Agent` tool with `subagent_type="general-purpose"`:

```python
Agent(
  subagent_type="general-purpose",
  description="Implement Task 3: Add role-cache invalidation",
  prompt="""
    [paste the implementer-prompt.md template, filling in task description + context]
  """
)
```

Always include SHARP-specific context in the prompt:
- "Filter by `school_id` on every multi-tenant query"
- "Use `academic_sessions` not `public.sessions`"
- "Reuse `src/components/` before creating new"
- "Reference `docs/INDEX.md` if the task touches a feature area"

## The full chain

```
/brainstorm → /plan → (for each task in plan) {
  Agent(general-purpose) with implementer-prompt.md
  → if DONE: Agent(general-purpose) with spec-reviewer-prompt.md
  → if spec ✅: Agent(general-purpose) with code-quality-reviewer-prompt.md
  → if approved: mark done
} → /finish → /reflect
```

## Editing these templates

If you change a template, also update the original in the plugin cache (or leave a comment here noting the divergence). The plugin cache is the canonical source; these copies are for convenience and SHARP-specific addenda.
