# KEY ROTATION RUNBOOK

> Guide for rotating leaked secrets in SHARP. Last updated: 2026-06-11.

> **⚠️ IMPORTANT**: If `.env` was leaked, you MUST also run git-filter-repo to scrub it from history. Just rotating the key is NOT enough.

---

## When to Use This Runbook

| Scenario | Steps |
|----------|-------|
| `.env` file leaked / committed to git | Step 1 + Step 2 + Step 3 |
| Only key value compromised (not in git) | Step 1 only |
| Key rotated but history still dirty | Step 2 + Step 3 |

---

## Step 1: Rotate the Key (Supabase)

### 1.1: Open Supabase Dashboard

- Go to: https://supabase.com/dashboard
- Sign in → Select project **ndtqhschvnyloeccaelv** (SHARP)

### 1.2: Go to API Keys Settings

- Left sidebar → **Settings** (gear icon)
- Click **API** or **API Keys**

### 1.3: Rotate the Key

1. Find **service_role** row (NOT `anon` or `publishable`)
2. Click **Roll / Rotate / Regenerate** button
3. Confirm the rotation

### 1.4: Copy New Key

1. Copy the new key value
2. Open your `.env` file
3. Replace the old value:
   ```
   VITE_SUPABASE_SERVICE_ROLE_KEY="NEW_KEY_HERE"
   ```

### 1.5: Update Production (if deployed)

- **Vercel**: Settings → Environment Variables → Edit → Save → Redeploy
- **Netlify**: Site settings → Environment variables → Edit → Save → Redeploy

### 1.6: Verify Old Key is Dead

```bash
curl -H "Authorization: Bearer OLD_KEY" https://ndtqhschvnyloeccaelv.supabase.co/rest/v1/schools
```
Expected: `{"message":"Invalid API key"}` or 401

---

## Step 2: Scrub .env from Git History

> **DESTRUCTIVE**: Rewrites all commit hashes. All collaborators must re-clone.

### 2.1: Install git-filter-repo

```bash
pip install git-filter-repo
```

### 2.2: Backup Your Local Repo

```bash
cd /c/Users/MUBASHIR/Documents/GitHub/Sharp
cp -r .git .git.backup
git stash push -u -m "pre-rewrite backup"
```

### 2.3: Run git-filter-repo

```bash
git filter-repo --path .env --invert-paths --force
```

### 2.4: Verify .env is Gone

```bash
git log --all --oneline -- .env
# Expected: empty
```

### 2.5: Force Push to Remote

```bash
git push origin --force --all
git push origin --force --tags
```

> **If GitHub rejects (protected branch)**
> 1. Go to Settings → Branches
> 2. Uncheck "Protect this branch"
> 3. Push → Re-enable protection

### 2.6: Restore Your Stash

```bash
git stash pop
```

---

## Step 3: Post-Verification Tests

### 3.1: Fresh Clone Test

```bash
cd /c/Users/MUBASHIR/Documents/GitHub
git clone https://github.com/MubashirLive/Sharp.git Sharp-test
cd Sharp-test
```

### 3.2: .env Not Tracked

```bash
git ls-files .env
# Expected: empty
```

### 3.3: .env Not in History

```bash
git log --all --oneline -- .env
# Expected: empty
```

### 3.4: Build Works

```bash
npm install && npm run build
```

### 3.5: Edge Functions Work (live test)

```bash
npm run dev
```

1. Login as superadmin
2. Go to SuperAdmin page
3. Verify schools list loads
4. Try creating a test school

---

## Step 4: Final Cleanup

### 4.1: Delete Backup

```bash
rm -rf .git.backup
```

### 4.2: Notify Team

> **Template:**

```
Subject: Git history rewritten — re-clone required

Team,

The SHARP repository history was rewritten to remove a leaked .env file. All commit hashes changed.

ACTION:
1. Delete your local copy: rm -rf Sharp
2. Re-clone: git clone https://github.com/MubashirLive/Sharp.git
3. Restore any uncommitted work from your backup

DO NOT run `git pull` on existing clones — it will fail.

Questions: ping me.
```

---

## Summary Checklist

- [ ] Rotated Supabase service_role key
- [ ] Updated local .env
- [ ] Updated production secrets (if deployed)
- [ ] Installed git-filter-repo
- [ ] Backed up .git
- [ ] Ran git-filter-repo
- [ ] Verified .env gone from history
- [ ] Force-pushed to remote
- [ ] Notified team to re-clone
- [ ] Fresh clone test passed
- [ ] Build works
- [ ] Edge functions work in browser