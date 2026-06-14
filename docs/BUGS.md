This file contain all the bugs which are yet to be solved.

## 2. Role System & Resolution (CRITICAL FIX)

### 2.1 The Bug (DATABASE_REPORT.md §3.1)

**Two separate role systems exist and are out of sync:**

**System A — DB `user_roles` table:**
```sql
user_id | role           | school_id
--------|----------------|----------
xxx     | 'super_admin'  | NULL
xxx     | 'principal'    | school-uuid
```

**System B — App `profiles.role` column:**
```typescript
role: 'superadmin' | 'principal' | 'admin' | 'teacher' | 'student'
```

**Mismatch Table:**
| DB `user_roles.role` | App `profiles.role` | Status |
|---|---|---|
| `'super_admin'` | `'superadmin'` | ❌ MISMATCH (underscore) |
| `'student_parent'` | `'student'` | ❌ MISMATCH (different name) |
| `'principal'` | `'principal'` | ✅ Match |
| `'admin'` | `'admin'` | ✅ Match |
| `'teacher'` | `'teacher'` | ✅ Match |

**Impact:** A user who is `'super_admin'` in `user_roles` gets `null` role in `AuthContext.tsx:46` because `'super_admin' !== 'superadmin'`. Auth checks fail silently. App crashes or shows wrong UI.

### 2.2 Decision: Option A — Single Source of Truth

**Chosen approach:** Use `profiles.role` as the single source of truth. Drop `user_roles` table entirely.

**Rationale:**
- Simpler mental model: one column, one enum
- `profiles` is already queried on every auth state change
- `user_roles` adds JOIN complexity with no benefit
- `school_id` already exists on `profiles` for multi-tenancy

### 2.3 Unified Role Enum

```typescript
// src/lib/constants.ts
export const APP_ROLES = [
  'super_admin',      // Was 'superadmin' — standardize to snake_case
  'principal',
  'master_admin',
  'admin',
  'teacher',
  'non_teaching',
  'student'
] as const;

export type AppRole = typeof APP_ROLES[number];

// DB enum (migration to update)
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'principal', 
  'master_admin',
  'admin',
  'teacher',
  'non_teaching',
  'student'
);
```

### 2.4 Role Resolution Flow

```
AuthContext.tsx
├── supabase.auth.onAuthStateChange
│   └── event === 'SIGNED_IN'
│       └── fetch profiles WHERE user_id = auth.uid()
│           └── setRole(profile.role as AppRole)  ← single source
│               └── render AppShell based on role
└── No secondary query to user_roles needed
```

### 2.5 Role Hierarchy (for permission checks)

```
super_admin
  └── principal
        └── master_admin
              └── admin
                    ├── teacher
                    └── non_teaching
                          └── student (mobile-only, limited scope)
```

**Permission inheritance:** Higher roles can perform actions of lower roles within their school (except Super Admin who has zero school access).