-- Backfill principal fields on schools from their principal profile.
-- Fixes: SuperAdmin-filled school fields not locking for existing schools.

UPDATE schools s
SET
  principal_name  = p.full_name,
  principal_email = p.email,
  principal_mobile = p.mobile
FROM profiles p
WHERE
  p.school_id = s.id
  AND p.role   = 'principal'
  -- Only overwrite if school columns are null; preserve any already-set values
  AND (
    (s.principal_name  IS NULL AND p.full_name IS NOT NULL AND p.full_name <> '')   OR
    (s.principal_email IS NULL AND p.email     IS NOT NULL AND p.email     <> '')   OR
    (s.principal_mobile IS NULL AND p.mobile    IS NOT NULL AND p.mobile    <> '')
  );
