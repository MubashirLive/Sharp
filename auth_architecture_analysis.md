# Auth Architecture — SHARP Rebuild (FastAPI + PostgreSQL)

> A genuine, critique-included analysis. No sugar-coating.

---

## Part 1: Your Questions, Answered Directly

### Q1: Do you need State → City → School selection at login?

**Short answer: No. Drop it for the school portal.**

Here's why:

| Approach | Verdict |
|---|---|
| **State → City → School cascade** | ❌ Unnecessary friction. This was a Supabase-era workaround because you had a single app serving all schools. In a proper backend, the credential itself identifies the school. |
| **Just enter credentials** | ✅ Correct. The principal's email is globally unique. The teacher's phone number + school_id is resolvable server-side. |

**What your old system got wrong:** Your previous [AUTH.md](file:///c:/Users/MUBASHIR/Documents/GitHub/Sharp/docs/AUTH.md) had a `SchoolSelector` component (State → City → School) on every login page. This made sense only because Supabase's client-side auth couldn't easily resolve "which school does this phone number belong to" — you needed the user to narrow it down first. With your own FastAPI backend, **your server can do this lookup in <5ms**.

**The one edge case:** A teacher who works at two schools under the same phone number. This is rare but real in India (visiting faculty). Handle it like this:
- Server finds 2+ profiles for the phone number
- Return a minimal school picker (just school name + emblem, not the full State→City→School cascade)
- User taps the school → proceed to OTP/auth

This is what Google does when one email has multiple workspace accounts. Don't pre-ask; resolve after credential input.

> [!TIP]
> For the **company website** (superadmin/sales admin), there's no school context at all. It's just email + password. No school selector needed.

---

### Q2: Sign-up flow — is your current approach correct?

**Yes, your instinct is correct and industry-standard.** No self-sign-up. This is exactly how enterprise SaaS works (Salesforce, Workday, Google Workspace).

```
Your team (SuperAdmin/SalesAdmin) creates → Principal account
Principal creates → Staff IDs + Student IDs
```

This is a **provisioned identity** model. It's the right call for a B2B school platform. Self-sign-up would be a security nightmare in an education context.

---

### Q3: Principal login — Email + Mobile OTP + 2FA on first login, then Password + dual OTP + 2FA on new devices

**I need to be blunt: this is overkill and will hurt adoption.**

Here's my honest critique and what I'd recommend instead:

#### What you proposed:
```
First login: Email link → Set password → Verify mobile OTP → Verify email OTP → Setup 2FA (TOTP)
Every new device: Password → Mobile OTP → Email OTP → 2FA code
```

That's **4 authentication factors** on every new device. Even banks don't do this. Let me compare:

| Service | New Device Login |
|---|---|
| Google Workspace Admin | Password → one 2FA method (TOTP or push) |
| Microsoft 365 Admin | Password → one MFA method (authenticator or SMS) |
| Razorpay Dashboard | Password → OTP (email or mobile, not both) |
| Your proposal | Password → OTP mobile → OTP email → TOTP code |

#### What I recommend instead:

**First-time setup (account activation):**
```
1. SuperAdmin creates principal → system generates a secure activation link
2. Link sent to principal's email (link expires in 48h, single-use)
3. Principal clicks link → verifies mobile via OTP (proves they own the phone)
4. Sets password (strong: 12+ chars, complexity rules)
5. Sets up TOTP 2FA (mandatory, show QR + backup codes)
6. Done. Account active.
```

**Daily login (known device):**
```
Email + Password → Dashboard
(Session: 8h idle timeout, 30-day absolute max, refresh token rotation)
```

**New device login:**
```
Email + Password + TOTP code → Dashboard
```

**Why this is better:**
- Dual OTP (email + mobile) on every new device is security theater. If an attacker has the password + TOTP seed, they likely have email access too. TOTP alone is stronger than dual OTP because it's **offline** — it can't be intercepted via SIM swap or email compromise.
- SMS OTP is the **weakest** 2FA method (SS7 attacks, SIM swap). TOTP (Google Authenticator / Authy) is strictly superior.
- Your principals are school administrators, not nuclear launch officers. If login takes 2+ minutes with 4 factors, they'll share credentials with their PA.

> [!WARNING]
> **The real security risk for principals isn't weak authentication — it's credential sharing.** If login is too painful, principals will write passwords on sticky notes or give their PA full access. Make security convenient or it gets bypassed.

#### Password reset for Principal:
```
1. Click "Forgot Password" on login page
2. Enter email → system sends a time-limited reset link (15 min expiry)
3. Click link → enter new password + confirm
4. Must verify TOTP code to complete reset (proves they still have 2FA)
5. All existing sessions invalidated
```

If they've also lost their TOTP device → SuperAdmin-initiated reset (identity verification via phone call + reset via admin panel → forces re-setup of password + TOTP).

---

### Q4: Teacher/Student — OTP-only login

**OTP-only is clean for teachers. But let me push back on the implementation.**

#### For Teachers (Web + Mobile):

**Your old system used PIN.** Your new proposal is OTP-only. Here's the tradeoff:

| Method | Pros | Cons |
|---|---|---|
| **PIN (your old system)** | Fast daily login, works offline, no SMS cost | PIN sharing is easy, no proof of identity |
| **OTP-only (your new proposal)** | Proves phone possession every time | SMS cost per login, slow (wait for SMS), fails if no signal, terrible UX for daily use |
| **OTP first-time + session token (recommended)** | Best of both — proves identity initially, fast daily access | Slightly more complex backend |

**My recommendation for teachers:**

```
First login (account activation):
1. Teacher receives Staff ID from principal
2. Opens app/web → enters phone number or Staff ID
3. System sends OTP to registered mobile
4. Verifies OTP → sets a 6-digit PIN (for daily quick-access)
5. Account activated

Daily login:
- Phone/Staff ID → PIN → Dashboard
- Session: 7-day sliding window

New device:
- Phone/Staff ID → OTP → then set PIN on this device → Dashboard

Password/PIN recovery:
- OTP to registered mobile → set new PIN
```

**Why not OTP-every-time for teachers:**
- At ₹0.15-0.25 per SMS, a school with 100 teachers logging in daily = ₹450-750/month just for teacher auth. Multiply by 500 schools = ₹2.25-3.75 lakhs/month in SMS costs alone.
- Teachers in rural schools have patchy network. OTP delivery takes 30-60 seconds. PIN is instant.
- WhatsApp OTP is cheaper but unreliable for auth (delivery not guaranteed).

> [!IMPORTANT]
> **Keep PIN for daily login.** Use OTP only for: first-time activation, new device verification, and PIN recovery. This is exactly what PhonePe, Paytm, and CRED do — and they have similar security requirements.

#### For Students (Mobile only):

Same as teachers. OTP for activation + new device. PIN for daily. Students don't use web, so this is purely mobile.

---

## Part 2: Complete Auth Architecture for FastAPI + PostgreSQL

### Token Strategy

Since you're moving from Supabase Auth to your own FastAPI backend, here's the token architecture:

```
┌─────────────────────────────────────────────────────┐
│                   Token Design                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Access Token (JWT)                                  │
│  ├── Issuer: your FastAPI server                     │
│  ├── Lifetime: 15 minutes                            │
│  ├── Storage: Memory (JS variable, NOT localStorage) │
│  ├── Claims: user_id, role, school_id, device_id     │
│  └── Signed with: RS256 (asymmetric key pair)        │
│                                                      │
│  Refresh Token (opaque, NOT JWT)                     │
│  ├── Lifetime: 7 days (teachers), 30 days (principal)│
│  ├── Storage: HttpOnly, Secure, SameSite=Strict cookie│
│  ├── Rotation: new refresh token on every use         │
│  ├── Family tracking: detect token reuse → revoke all │
│  └── Stored in DB: refresh_tokens table               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Why RS256 over HS256:** Your system has multiple services (FastAPI, possibly workers, mobile API). With RS256, only the auth service has the private key; everyone else verifies with the public key. HS256 requires sharing the secret everywhere — one leak and all tokens are forgeable.

**Why NOT store JWT in localStorage:** XSS attack = game over. In-memory + HttpOnly refresh cookie is the industry standard (Auth0, Firebase, Clerk all do this).

### Database Schema (Auth-related tables)

```sql
-- Core identity
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE,                    -- Principal/SuperAdmin only
    phone           TEXT,                            -- All roles except SuperAdmin
    phone_country   TEXT DEFAULT '+91',
    role            TEXT NOT NULL CHECK (role IN (
                        'super_admin', 'sales_admin',
                        'principal',
                        'master_admin', 'admin',
                        'teacher', 'non_teaching',
                        'student'
                    )),
    school_id       UUID REFERENCES schools(id),    -- NULL for super_admin, sales_admin
    status          TEXT NOT NULL DEFAULT 'provisioned' CHECK (status IN (
                        'provisioned',   -- Account created, never logged in
                        'active',        -- Normal state
                        'suspended',     -- Temporarily disabled
                        'locked',        -- Too many failed attempts
                        'deactivated'    -- Off-boarded
                    )),
    password_hash   TEXT,                            -- Principal/SuperAdmin only (argon2id)
    pin_hash        TEXT,                            -- Staff/Student (argon2id)
    totp_secret_enc TEXT,                            -- Principal only, encrypted at rest
    totp_enabled    BOOLEAN DEFAULT FALSE,
    backup_codes    TEXT[],                           -- Hashed backup codes for TOTP recovery
    must_setup      BOOLEAN DEFAULT TRUE,            -- Force setup on first login
    
    -- Metadata
    full_name       TEXT NOT NULL,
    salutation      TEXT,
    avatar_url      TEXT,
    staff_app_id    TEXT,                             -- Generated staff ID
    student_app_id  TEXT,                             -- Generated student ID
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      UUID REFERENCES users(id),
    last_login_at   TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT email_required_for_admin CHECK (
        (role IN ('super_admin', 'sales_admin', 'principal') AND email IS NOT NULL)
        OR role NOT IN ('super_admin', 'sales_admin', 'principal')
    ),
    CONSTRAINT phone_required_for_school CHECK (
        (role NOT IN ('super_admin', 'sales_admin') AND phone IS NOT NULL)
        OR role IN ('super_admin', 'sales_admin')
    ),
    CONSTRAINT unique_phone_per_school UNIQUE (phone, school_id)
);

CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone_school ON users(phone, school_id) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_school_role ON users(school_id, role);
CREATE INDEX idx_users_staff_app_id ON users(staff_app_id) WHERE staff_app_id IS NOT NULL;
CREATE INDEX idx_users_student_app_id ON users(student_app_id) WHERE student_app_id IS NOT NULL;

-- Device trust (replaces device_fingerprint single column)
CREATE TABLE trusted_devices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name     TEXT,                            -- "Chrome on Windows", "SHARP App on Redmi"
    ip_address      INET,
    last_used_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, device_fingerprint)
);

-- Refresh tokens (for token rotation + family tracking)
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,            -- SHA-256 of the token
    family_id       UUID NOT NULL,                   -- Token family for rotation detection
    device_id       UUID REFERENCES trusted_devices(id),
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    replaced_by     UUID REFERENCES refresh_tokens(id) -- Points to the new token
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_expiry ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

-- OTP codes
CREATE TABLE otp_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),       -- NULL for phone-lookup flows
    phone           TEXT,
    email           TEXT,
    channel         TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp')),
    purpose         TEXT NOT NULL CHECK (purpose IN (
                        'activation', 'login', 'pin_reset',
                        'device_verify', 'phone_change', 'email_change'
                    )),
    code_hash       TEXT NOT NULL,                   -- bcrypt/argon2
    attempts        INT DEFAULT 0,
    max_attempts    INT DEFAULT 3,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_user_purpose ON otp_codes(user_id, purpose) WHERE used_at IS NULL;

-- Login audit trail
CREATE TABLE login_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    identifier      TEXT NOT NULL,                   -- email/phone/app_id used
    method          TEXT NOT NULL,                   -- 'password', 'pin', 'otp', 'totp'
    success         BOOLEAN NOT NULL,
    failure_reason  TEXT,                             -- 'wrong_password', 'expired_otp', etc.
    ip_address      INET,
    user_agent      TEXT,
    device_fingerprint TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_user ON login_attempts(user_id, created_at DESC);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, created_at DESC);

-- Account activation links (for principals)
CREATE TABLE activation_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Hashing Strategy

> [!CAUTION]
> **Your old system used bcrypt for PINs.** That's fine, but for the rebuild, use **Argon2id** everywhere. It's the winner of the Password Hashing Competition, resistant to GPU/ASIC attacks, and the current OWASP recommendation.

| What | Algorithm | Parameters |
|---|---|---|
| Passwords (Principal/SuperAdmin) | Argon2id | memory=64MB, iterations=3, parallelism=4 |
| PINs (Staff/Student) | Argon2id | memory=32MB, iterations=3, parallelism=2 |
| OTP codes | Argon2id (lighter) | memory=16MB, iterations=2, parallelism=1 |
| Refresh tokens | SHA-256 | (not a password, just needs collision resistance) |
| TOTP secrets | AES-256-GCM | Encrypted at rest, key in env/vault |

---

## Part 3: Complete Login Flow Diagrams

### Principal — First-Time Activation

```
SuperAdmin creates principal
         │
         ▼
┌─────────────────────┐
│ System generates:    │
│ • Activation link    │
│ • Sends to email     │
│ (48h expiry,         │
│  single-use)         │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Principal clicks     │
│ activation link      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Step 1: Verify phone │
│ (OTP to registered   │
│  mobile, proves      │
│  ownership)          │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Step 2: Set password │
│ (12+ chars, strength │
│  meter, complexity)  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Step 3: Setup TOTP   │
│ (QR code for Google  │
│  Auth / Authy, show  │
│  8 backup codes,     │
│  verify one code)    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Account active.      │
│ Redirect to          │
│ onboarding wizard.   │
└─────────────────────┘
```

### Principal — Daily Login

```
┌──────────────────┐
│ Enter email      │
│ Enter password   │
│ Click "Sign In"  │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐     ┌─────────────────┐
│ Is this a known  │─No─▶│ Enter TOTP code  │
│ device?          │     │ (6-digit from    │
└───────┬──────────┘     │  authenticator)  │
        │Yes             └───────┬─────────┘
        │                        │
        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│ Issue tokens.    │     │ "Trust this      │
│ Redirect to      │     │  device?" toggle  │
│ dashboard.       │     │ If yes → save     │
└──────────────────┘     │ fingerprint.      │
                         │ Issue tokens.     │
                         └──────────────────┘
```

### Teacher/Staff — Activation + Daily

```
ACTIVATION:
┌──────────────────┐
│ Enter phone or   │
│ Staff App ID     │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ Server resolves  │──── If 2+ schools found ────▶ Mini school picker
│ user by phone/ID │                                     │
└───────┬──────────┘                                     │
        │ (1 school)                                     │
        │◀───────────────────────────────────────────────┘
        ▼
┌──────────────────┐
│ OTP to registered│
│ mobile           │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ Verify OTP       │
│ → Set 6-digit PIN│
│ → Confirm PIN    │
└───────┬──────────┘
        │
        ▼
  Account active

DAILY LOGIN:
┌──────────────────┐
│ Enter phone or   │
│ Staff App ID     │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ Show ProfileCard │
│ (avatar + name + │
│  Staff ID)       │
│ "Not you?" link  │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ Enter 6-digit PIN│
│ (PINKeypad)      │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ Success →        │
│ Dashboard        │
│                  │
│ Fail (1-4) →     │
│ "X attempts left"│
│                  │
│ Fail (5) →       │
│ Account locked   │
│ (auto-unlock 24h)│
└──────────────────┘
```

---

## Part 4: FastAPI Endpoint Design

```
POST /api/v1/auth/login/password         # Principal/SuperAdmin: email + password
POST /api/v1/auth/login/pin              # Staff/Student: phone/appId + PIN
POST /api/v1/auth/login/totp-verify      # Principal: TOTP code (after password, new device)

POST /api/v1/auth/otp/send               # Send OTP (activation, recovery, device verify)
POST /api/v1/auth/otp/verify             # Verify OTP

POST /api/v1/auth/activate               # First-time: set password/PIN, complete setup
POST /api/v1/auth/activate/totp-setup    # Principal: generate TOTP QR + backup codes
POST /api/v1/auth/activate/totp-confirm  # Principal: verify first TOTP code

POST /api/v1/auth/token/refresh          # Exchange refresh token for new access token
POST /api/v1/auth/logout                 # Revoke refresh token + clear cookie
POST /api/v1/auth/logout-all             # Revoke ALL sessions for user

POST /api/v1/auth/password/forgot        # Send reset link to email
POST /api/v1/auth/password/reset         # Set new password via reset token + TOTP
POST /api/v1/auth/pin/reset              # Reset PIN via OTP

GET  /api/v1/auth/me                     # Current user profile + role + school
GET  /api/v1/auth/devices                # List trusted devices
DELETE /api/v1/auth/devices/{id}         # Revoke a trusted device

# Admin-initiated resets
POST /api/v1/admin/auth/reset-password   # SuperAdmin resets principal password
POST /api/v1/admin/auth/reset-pin        # Principal/MasterAdmin resets staff/student PIN
POST /api/v1/admin/auth/create-user      # Provision a new account
POST /api/v1/admin/auth/deactivate-user  # Deactivate an account
```

---

## Part 5: Security Measures (Non-Negotiable)

### Rate Limiting (per endpoint)

| Endpoint | Limit | Window |
|---|---|---|
| `/auth/login/*` | 5 attempts | 15 min, per IP + per identifier |
| `/auth/otp/send` | 3 sends | 10 min, per phone number |
| `/auth/password/forgot` | 3 requests | 1 hour, per email |
| `/auth/token/refresh` | 30 requests | 1 min (legitimate apps refresh ~every 15min) |
| All other auth endpoints | 20 requests | 1 min |

Use **sliding window** rate limiting (Redis-backed). Don't use fixed window — it has the burst-at-boundary problem.

### Account Lockout

```
PIN: 5 wrong attempts in 15 min → lock 1 hour (auto-unlock)
Password: 5 wrong attempts in 15 min → lock 1 hour (auto-unlock)
         10 wrong in 24h → lock 24 hours
OTP: 3 wrong per code → code invalidated, must request new
TOTP: 5 wrong in 15 min → lock 1 hour
```

### Headers & Transport

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Part 6: What Changed from Your Old System

| Aspect | Old (Supabase) | New (FastAPI) | Why |
|---|---|---|---|
| **Auth provider** | Supabase Auth (GoTrue) | Custom FastAPI | Full control, no vendor lock-in |
| **School selector** | State→City→School on every login | Only if multi-school conflict | Less friction |
| **Principal auth** | Email + temp password → PIN | Email + activation link → password + TOTP | More secure, no shared temp passwords |
| **Staff daily** | PIN via edge function | PIN via FastAPI endpoint | Same UX, better infrastructure |
| **Token format** | Supabase JWT (HS256) | Custom JWT (RS256) + opaque refresh | Better security model |
| **Token storage** | Supabase manages (localStorage) | Access in memory, refresh in HttpOnly cookie | XSS-resistant |
| **Password hash** | bcrypt (via Supabase) | Argon2id | Current best practice |
| **PIN hash** | bcrypt (via edge function) | Argon2id | Current best practice |
| **2FA** | Deferred to Phase 2 | Built-in from day 1 for Principal | No excuses this time |
| **Session** | 30-day Supabase session | 15-min access + 7/30-day refresh with rotation | Tighter security |

---

## Part 7: What I'd Criticize About Your Proposal

### 1. Dual OTP (email + mobile) is security theater
You proposed both email OTP + mobile OTP for principal login on new devices. This sounds secure but isn't meaningfully better than TOTP alone. SMS OTP is vulnerable to SIM swap. Email OTP requires email access (if the attacker has the password, they might have email too). TOTP is offline and unhackable remotely. **Pick TOTP as the single second factor.** Simpler, cheaper, more secure.

### 2. The "link sent to principal email" for first login is correct
This is the right approach — but call it what it is: an **activation link**, not a "link to login." Industry term matters for your developers.

### 3. "Every new device: password + two OTP + 2FA" is hostile UX
A principal who logs in from their school desktop, their home laptop, and their phone would need to endure this 4-step process 3 times. After that, any browser update that clears cookies = do it again. They will revolt. **Known device = password only. Unknown device = password + TOTP. That's it.**

### 4. OTP-only for teacher daily login is economically unsustainable
At scale (500 schools × 50 teachers × 22 working days), that's 550,000 SMS per month. At ₹0.20/SMS = ₹1.1 lakh/month just for teacher login. Use OTP for activation + recovery only. PIN for daily.

### 5. Don't conflate "student has only mobile" with "student needs different auth"
The auth flow is identical for student and teacher: Phone → OTP (first time) → PIN (daily). The only difference is the platform constraint (mobile-only for student). Don't build a separate auth system for students — reuse the same endpoints.

---

## Part 8: Recommended Architecture Summary

```
┌────────────────────────────────────────────────────────────────┐
│                     AUTH ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  COMPANY WEBSITE (superadmin.sharp.com)                        │
│  ├── SuperAdmin: Email + Password + TOTP                       │
│  └── SalesAdmin: Email + Password + TOTP                       │
│                                                                │
│  SCHOOL WEBSITE (app.sharp.com or school-slug.sharp.com)       │
│  ├── Principal: Email + Password + TOTP (new device)           │
│  ├── Teacher:   Phone/StaffID + PIN (daily)                    │
│  │              Phone/StaffID + OTP (activation/recovery/new)  │
│  └── Student:   Phone/StudentID + PIN (daily, mobile only)     │
│                 Phone/StudentID + OTP (activation/recovery/new)│
│                                                                │
│  SHARED INFRASTRUCTURE                                         │
│  ├── Tokens: RS256 JWT (15min) + HttpOnly refresh cookie       │
│  ├── Hashing: Argon2id                                         │
│  ├── Rate Limiting: Redis sliding window                       │
│  ├── OTP Provider: MSG91 / Twilio (SMS) + SES/Resend (email)  │
│  ├── 2FA: TOTP (Google Authenticator / Authy)                  │
│  └── Audit: Every auth event logged to login_attempts          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> This architecture is designed for your scale (500+ schools, thousands of daily logins). It balances security with UX and keeps operational costs (SMS) manageable. The critical insight: **make the right thing the easy thing**, or people will work around your security.
