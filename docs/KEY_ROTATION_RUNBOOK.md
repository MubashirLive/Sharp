# Key Rotation Runbook

> Guide for rotating leaked secrets in SHARP. Last updated 2026-06-11.

> **⚠️ If `.env` was leaked, you MUST also run git-filter-repo to scrub it from history. Just rotating the key is NOT enough.**

## When to use

| Scenario | Steps |
|---|---|
| `.env` file leaked / committed to git | Step 1 + 2 + 3 |
| Only key value compromised (not in git) | Step 1 only |
| Key rotated but history still dirty | Step 2 + 3 |

---

## Step 1 — Rotate the key (Supabase)

1. **Open dashboard** → https://supabase.com/dashboard → project `ndtqhschvnyloeccaelv` (SHARP).
2. **Settings** (gear) → **API** / **API Keys**.
3. Find **service_role** row (NOT `anon` / `publishable`) → click **Roll / Rotate / Regenerate** → confirm.
4. Copy new key. In `.env`:
   ```
   VITE_SUPABASE_SERVICE_ROLE_KEY="NEW_KEY_HERE"
   ```
5. **Update production** if deployed:
   - **Vercel**: Settings → Env Variables → Edit → Save → Redeploy
   - **Netlify**: Site settings → Env variables → Edit → Save → Redeploy
6. **Verify old key dead**:
   ```bash
   curl -H "Authorization: Bearer OLD_KEY" https://ndtqhschvnyloeccaelv.supabase.co/rest/v1/schools
   # Expected: 401 / "Invalid API key"
   ```

---

## Step 2 — Scrub `.env` from git history

> **DESTRUCTIVE** — rewrites all commit hashes. All collaborators must re-clone.

```bash
# 2.1 Install
pip install git-filter-repo

# 2.2 Backup
cd /c/Users/MUBASHIR/Documents/GitHub/Sharp
cp -r .git .git.backup
git stash push -u -m "pre-rewrite backup"

# 2.3 Run filter
git filter-repo --path .env --invert-paths --force

# 2.4 Verify gone
git log --all --oneline -- .env   # expected: empty

# 2.5 Force push
git push origin --force --all
git push origin --force --tags
# If rejected (protected branch): Settings → Branches → uncheck "Protect this branch" → push → re-enable

# 2.6 Restore stash
git stash pop
```

---

## Step 3 — Post-verification

```bash
# 3.1 Fresh clone
cd /c/Users/MUBASHIR/Documents/GitHub
git clone https://github.com/MubashirLive/Sharp.git Sharp-test
cd Sharp-test

# 3.2 .env not tracked
git ls-files .env   # expected: empty

# 3.3 .env not in history
git log --all --oneline -- .env   # expected: empty

# 3.4 Build works
npm install && npm run build

# 3.5 Edge functions work (live)
npm run dev
# Login as superadmin → SuperAdmin page → schools list loads → create test school
```

---

## Step 4 — Final cleanup

```bash
rm -rf .git.backup
```

**Notify team** (template):
```
Subject: Git history rewritten — re-clone required

Team, SHARP repo history was rewritten to remove a leaked .env. All commit hashes changed.

ACTION:
1. Delete your local copy: rm -rf Sharp
2. Re-clone: git clone https://github.com/MubashirLive/Sharp.git
3. Restore any uncommitted work from your backup

DO NOT run `git pull` on existing clones — it will fail.

Questions: ping me.
```

---

## Checklist

- [ ] Rotated Supabase service_role key
- [ ] Updated local `.env`
- [ ] Updated production secrets (if deployed)
- [ ] Old key returns 401
- [ ] Installed `git-filter-repo`
- [ ] Backed up `.git`
- [ ] Ran `git-filter-repo`
- [ ] Verified `.env` gone from history
- [ ] Force-pushed to remote
- [ ] Notified team to re-clone
- [ ] Fresh clone test passed
- [ ] Build works
- [ ] Edge functions work in browser
- [ ] Removed `.git.backup`
