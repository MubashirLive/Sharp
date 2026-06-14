# SHARP — Remaining Improvements

## Done ✅

### Performance Indexes
- ✅ 27+ indexes applied (school_id, class_id, section_id, mobile, role, date)
- ✅ `idx_profiles_mobile`, `idx_profiles_school_role`, `idx_students_school_class_section`

### Pagination & Query Optimization
- ✅ Students: `.range(0, 99)` with "Load More"
- ✅ Chat: `.limit(50)`
- ✅ Calendar: `.limit(100)` on national_holidays, getMyTasks
- ✅ Replaced `.select("*")` with explicit columns
- ✅ Fixed N+1 in chatService

### RLS Optimization
- ✅ `user_roles` table created (indexes: user_id, school_id, user_school_role, school_active)
- ✅ `staffs` table created
- ✅ `students` RLS updated to use `user_roles` EXISTS
- ✅ `calendar_events` RLS updated to use `user_roles` EXISTS

### Frontend Performance
- ✅ TanStack Query v5 in use
- ✅ Debounced search on Students page (300ms)
- ✅ `@tanstack/react-virtual` installed (ready when needed)
- ✅ `use-debounce` installed (ready when needed)

---

## Remaining

### Medium Priority

**1. TanStack Virtual**
- **When:** Any list exceeds 500 items
- **Package:** Installed, just not used yet
- **Status:** Ready to enable when scale requires

**2. Redis/Upstash Cache**
- **For:** School config, dashboard summaries, feature flags
- **When:** After measuring slow queries with `pg_stat_statements`
- **Status:** Premature until measurement done

**3. Background Jobs**
- **For:** Bulk imports, reports, notifications, fee calculations
- **When:** Those features exist
- **Tools:** Supabase Edge Functions, Inngest, or Trigger.dev

**4. File Upload Pipeline**
- **For:** CSV/Excel bulk import
- **Status:** Depends on import feature development

**5. Analytics Tables**
- **For:** Pre-aggregated dashboards
- **Status:** Build when dashboards exist

---

### Low Priority

**6. Slow Query Monitoring**
- Check `pg_stat_statements` for actual slow queries
- Add index hints or rewrite as needed

**7. Separate Read Replicas**
- For 500+ schools, may need read replica for dashboards
- Premature until primary DB shows strain

---

## Measurement First

Before adding new infrastructure:
1. Check `pg_stat_statements` for actual slow queries
2. Load test with realistic data (500 schools, 600K students)
3. Then decide what infrastructure needed