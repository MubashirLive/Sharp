<!--
Source: superpowers plugin v5.1.0
License: MIT
Path of origin: C:\Users\MUBASHIR\.claude\plugins\cache\claude-plugins-official\superpowers\5.1.0\skills\subagent-driven-development\code-quality-reviewer-prompt.md
Copied: 2026-06-18
-->

# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Agent (general-purpose):
  subagent_type: "general-purpose"
  description: "Code quality review for Task N"
  prompt: |
    Use template at requesting-code-review/code-reviewer.md (in superpowers plugin)
    as the base. See: C:\Users\MUBASHIR\.claude\plugins\cache\claude-plugins-official\
    superpowers\5.1.0\skills\requesting-code-review\code-reviewer.md

    DESCRIPTION: [task summary, from implementer's report]
    PLAN_OR_REQUIREMENTS: Task N from [plan-file]
    BASE_SHA: [commit before task]
    HEAD_SHA: [current commit]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment

## SHARP-specific additions

Reviewer should additionally check:
- **Multi-tenant filter:** Every query on school data MUST include `school_id` filter. Flag any query that reads school data without it.
- **Subject hierarchy:** If touching subjects, confirm correct tier (`school_subjects` / `subjects` / `section_subjects`).
- **session var:** Never query `public.sessions` for academic data. Use `academic_sessions`.
- **Component reuse:** New components should match existing patterns in `src/components/`. Flag if a new component duplicates existing functionality.
- **No raw Supabase auth calls:** Should go through `AuthContext`.
