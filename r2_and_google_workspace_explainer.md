# Cloudflare R2 & Google Workspace — Complete Explainer

---

## ☁️ What is Cloudflare R2?

### Simple Explanation

Think of it like a **hard drive in the cloud** where you store files (PDFs, images, videos, anything). It's made by **Cloudflare** — one of the biggest internet companies that already powers ~20% of all websites.

```
Your App  ──uploads file──▶  Cloudflare R2 (stores it)
                                    │
Student   ◀──downloads file────────┘  ← THIS part is FREE (no bandwidth charge)
```

### Why Does R2 Exist?

Amazon S3 has been the industry standard for file storage for 15+ years. But Amazon charges **heavily for bandwidth** (downloading files). Cloudflare created R2 specifically to compete with S3 by saying:

> "We'll charge you for storage, but downloading? **FREE. Forever.**"

This is their business strategy to steal customers from Amazon.

### R2 vs Normal Cloud Storage — The Key Difference

| | AWS S3 | Google Cloud | Supabase | **Cloudflare R2** |
|---|---|---|---|---|
| Store 1 GB | $0.023/mo | $0.020/mo | $0.021/mo | **$0.015/mo** |
| Download 1 GB | $0.09 😤 | $0.12 😤 | $0.09 😤 | **$0.00** 🎉 |
| Download 1 TB | **$92** 😤 | **$123** 😤 | **$92** 😤 | **$0.00** 🎉 |
| Download 10 TB | **$920** 😤😤 | **$1,230** 😤😤 | **$920** 😤😤 | **$0.00** 🎉🎉 |

> The more students download, the more you save with R2. At scale, this is a **massive** difference.

---

## 💵 How Does Cloudflare R2 Charge? (Exact Breakdown)

### You Pay For 3 Things Only

#### 1. Storage — How much data you're keeping

| Amount Stored | Cost |
|---|---|
| First 10 GB | **FREE** |
| After 10 GB | **$0.015 per GB per month** |

**Example:** You have 500 GB of teacher-uploaded files stored
```
500 GB × $0.015 = $7.50/month for storage
```

#### 2. Class A Operations — Writing/uploading files

| Operation | Cost |
|---|---|
| First 1 million writes/month | **FREE** |
| After that | **$4.50 per million** |

**Example:** 400 teachers upload 30 files each = 12,000 uploads/month
```
12,000 uploads → FREE (well under 1 million)
```

#### 3. Class B Operations — Reading/downloading files

| Operation | Cost |
|---|---|
| First 10 million reads/month | **FREE** |
| After that | **$0.36 per million** |

**Example:** 100,000 students × 5 downloads/day × 22 days = 11 million reads/month
```
First 10 million → FREE
Remaining 1 million × $0.36 = $0.36/month
```

#### 4. Bandwidth — Downloading data

| Amount Downloaded | Cost |
|---|---|
| ANY amount | **$0.00 — ALWAYS FREE** |

**Example:** 100,000 students download 43 TB of content in a month
```
43 TB × $0.00 = $0.00
```

### Real Example: Your 100 School Scenario

```
📦 Storage:    4,000 GB × $0.015         = $60.00/month
📤 Uploads:    120,000 operations          = FREE (under 1M)
📥 Downloads:  11,000,000 operations       = $0.36/month (1M over free tier)
🌐 Bandwidth:  43 TB downloaded            = $0.00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL = $60.36/month  (₹~5,000/month)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Compare: Same thing on Supabase = $3,979/month (₹3.27 lakh)
Compare: Same thing on AWS S3   = $3,598/month (₹2.96 lakh)
```

### How to Sign Up & Set Up R2

```
Step 1: Go to cloudflare.com → Sign up (free account)
Step 2: Dashboard → R2 Object Storage → Create Bucket
Step 3: Name it "sharp-content" → Create
Step 4: Get your API keys (Account ID, Access Key, Secret Key)
Step 5: Use it from your app just like S3 (same API)
```

### Code Example — Upload & Download from R2

R2 uses the **exact same API as AWS S3**, so any S3 library works:

```typescript
// Install: npm install @aws-sdk/client-s3

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Setup — use your R2 credentials
const r2 = new S3Client({
  region: 'auto',
  endpoint: 'https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '<YOUR_R2_ACCESS_KEY>',
    secretAccessKey: '<YOUR_R2_SECRET_KEY>',
  },
});

// ── Teacher uploads a file ──────────────────────────
async function uploadFile(file: Buffer, fileName: string, schoolId: string) {
  await r2.send(new PutObjectCommand({
    Bucket: 'sharp-content',
    Key: `${schoolId}/materials/${fileName}`,   // organized by school
    Body: file,
    ContentType: 'application/pdf',
  }));
  
  console.log('Uploaded! Cost: basically $0');
}

// ── Student downloads a file ────────────────────────
async function getDownloadUrl(fileName: string, schoolId: string) {
  // Generate a temporary signed URL (expires in 1 hour)
  // Student downloads directly from R2 — bandwidth is FREE
  const url = await getSignedUrl(r2, new GetObjectCommand({
    Bucket: 'sharp-content',
    Key: `${schoolId}/materials/${fileName}`,
  }), { expiresIn: 3600 });
  
  return url;  // Give this URL to the student's app
}
```

```
Teacher's phone                    Cloudflare R2                  Student's phone
     │                                  │                               │
     │──── upload PDF (5 MB) ──────────▶│                               │
     │                                  │  Stores file (costs $0.015/GB)│
     │                                  │                               │
     │                                  │◀──── request download ────────│
     │                                  │───── sends PDF (5 MB) ───────▶│
     │                                  │                               │
     │                           Bandwidth cost: $0.00 ✅               │
```

---

## 🏫 What is Google Workspace for Education?

### Simple Explanation

Google Workspace for Education is **Google's free suite for schools** that includes:

| Tool | What It Is |
|---|---|
| **Gmail** | Email for every teacher & student (@schoolname.com) |
| **Google Drive** | Cloud storage for files |
| **Google Docs/Sheets/Slides** | Online document editing |
| **Google Classroom** | Online classes and assignments |
| **Google Meet** | Video calls |
| **Admin Console** | Manage all school accounts |

### The Free Plan — Google Workspace for Education Fundamentals

| Feature | What You Get |
|---|---|
| **Price** | **Completely FREE** for qualifying schools |
| **Storage** | **100 TB shared across the school** |
| **Per-user email** | ✅ teacher@yourschool.edu.in |
| **Google Drive** | ✅ Every teacher gets their own Drive |
| **Google Classroom** | ✅ Included |
| **Admin control** | ✅ Full admin panel |

> [!IMPORTANT]
> **100 TB of free storage per school.** That's 100,000 GB. Your 100-school scenario needs only 4,000 GB in Year 1. **One school's free quota alone could hold ALL your content.**

### Do Indian Schools Already Have This?

**YES — most already do.** Here's the reality:

| Fact | Details |
|---|---|
| **NEP 2020** mandated digital education | Schools were pushed to adopt Google/Microsoft |
| **COVID era (2020-2022)** | Almost every school signed up for Google Workspace or Microsoft 365 |
| **CBSE/ICSE schools** | 80-90% have Google Workspace |
| **State board schools** | 50-70% have it (growing) |
| **Cost to the school** | $0 — Google gives it free to verified educational institutions |

### How to Check If a School Has It

Ask the school admin:
- "Do your teachers have school email IDs like `teacher@schoolname.edu.in`?"
- If YES → they have Google Workspace ✅
- If NO → they can apply for free at [edu.google.com](https://edu.google.com)

---

## 💡 How to Use Google Drive as FREE Storage for Sharp

### The Concept

Instead of storing files on YOUR servers, store them on the **school's own Google Drive** (which is free and has 100 TB).

```
┌──────────────────────────────────────────────────────────────┐
│                     HOW IT WORKS                              │
│                                                               │
│  Teacher opens Sharp app                                      │
│       │                                                       │
│       ▼                                                       │
│  Selects a PDF to upload for "Chapter 3: Algebra"            │
│       │                                                       │
│       ▼                                                       │
│  Sharp app uploads file to the SCHOOL's Google Drive          │
│  (using a Service Account that the school authorized)         │
│       │                                                       │
│       ▼                                                       │
│  File lands in:                                               │
│  📁 Sharp_Materials/                                          │
│    📁 Class_10/                                               │
│      📁 Mathematics/                                          │
│        📄 Chapter_3_Algebra_Notes.pdf                        │
│       │                                                       │
│       ▼                                                       │
│  Sharp saves the file's Google Drive ID in Supabase DB        │
│  (just a small text string, like "1BxiMVs0XRA5nFMdKvBdBZjgmU│
│   UqptlMs8up")                                                │
│       │                                                       │
│       ▼                                                       │
│  Student opens Sharp app → sees "Chapter 3 materials"        │
│       │                                                       │
│       ▼                                                       │
│  App fetches file directly from Google Drive                  │
│  Google serves the file — YOU PAY NOTHING                     │
│                                                               │
│  Storage cost:  $0 (school's free 100 TB Google quota)        │
│  Bandwidth:     $0 (Google pays for bandwidth)                │
│  Your cost:     $0 ✅                                         │
└──────────────────────────────────────────────────────────────┘
```

### Setup Steps (One-Time Per School)

```
Step 1: Create a Google Cloud Project (free)
        → console.cloud.google.com

Step 2: Enable Google Drive API
        → APIs & Services → Enable "Google Drive API"

Step 3: Create a Service Account
        → This is like a "robot" Google account that your app uses
        → Download the JSON key file

Step 4: School admin shares a Drive folder with your Service Account
        → School creates folder "Sharp_Content" in their Drive
        → Shares it with your-app@your-project.iam.gserviceaccount.com
        → Gives "Editor" permission

Step 5: Your app now has full read/write access to that folder
        → Upload teacher files there
        → Generate download links for students
```

### Code Example — Google Drive Integration

```typescript
// Install: npm install googleapis

import { google } from 'googleapis';
import { Readable } from 'stream';

// Authenticate with Service Account
const auth = new google.auth.GoogleAuth({
  keyFile: './service-account-key.json',   // From Step 3
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// ── Teacher uploads a file ──────────────────────────
async function uploadToSchoolDrive(
  fileBuffer: Buffer,
  fileName: string,
  schoolFolderId: string,   // Each school has their own folder ID
  mimeType: string
) {
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [schoolFolderId],   // Upload into the school's folder
    },
    media: {
      mimeType: mimeType,          // 'application/pdf', 'image/jpeg', etc.
      body: Readable.from(fileBuffer),
    },
    fields: 'id, webViewLink, webContentLink',
  });

  // Save this ID in your Supabase database
  return {
    googleDriveFileId: response.data.id,          // "1BxiMVs0XRA5..."
    viewLink: response.data.webViewLink,           // Opens in Google Docs viewer
    downloadLink: response.data.webContentLink,    // Direct download
  };
}

// ── Student gets download link ──────────────────────
async function getStudentDownloadLink(googleDriveFileId: string) {
  // Make file accessible via link (anyone with link can view)
  await drive.permissions.create({
    fileId: googleDriveFileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Get the download URL
  const file = await drive.files.get({
    fileId: googleDriveFileId,
    fields: 'webContentLink, webViewLink',
  });

  return {
    download: file.data.webContentLink,    // Direct download link
    preview: file.data.webViewLink,        // View in browser (Google Docs viewer)
  };
}

// ── Delete old content ──────────────────────────────
async function deleteFile(googleDriveFileId: string) {
  await drive.files.delete({ fileId: googleDriveFileId });
}
```

### What the Student Experience Looks Like

```
Student opens Sharp app
    → Sees "Mathematics → Chapter 3 → Materials"
    → Taps "Algebra Notes.pdf"
    → App opens a WebView with Google's PDF viewer
       (or downloads the file directly)
    → Student reads the PDF

Behind the scenes:
    → App looked up the Google Drive file ID from Supabase
    → Used the webViewLink to show it in Google Docs viewer
    → Google served the file from THEIR servers
    → You paid: $0
```

### Google Drive API Limits (Are They Enough?)

| Limit | Value | Your Usage | OK? |
|---|---|---|---|
| Queries per day | **1,000,000,000** (1 billion) | ~11M/month = 367K/day | ✅ Way under |
| Queries per 100 seconds per user | **20,000** | Peak ~100/sec | ✅ Fine |
| Upload bandwidth | **750 GB/day per service account** | 600 GB/month total | ✅ Way under |
| File size limit | **5 TB per file** | Your files are 5-15 MB | ✅ Way under |
| Storage per school | **100 TB** (free Education plan) | ~72 GB/school/year | ✅ Way under |

---

## 📊 Which Should You Choose?

| Factor | Cloudflare R2 | Google Drive |
|---|---|---|
| **Cost at 100 schools** | **~$60/month** | **$0/month** |
| **Reliability** | 🟢 Very high (Cloudflare SLA) | 🟢 Very high (Google SLA) |
| **Setup complexity** | 🟢 Easy (just API keys) | 🟡 Medium (per-school setup needed) |
| **Dependency on school** | 🟢 None | 🟡 School must have Google Workspace |
| **Control over data** | 🟢 Full control | 🟡 Data lives on school's Drive |
| **Speed** | 🟢 Fast (global CDN) | 🟢 Fast (Google's CDN) |
| **Works if school leaves** | 🟢 Your data stays | 🔴 You lose access to their files |
| **Professional** | 🟢 Very | 🟡 Slightly hacky |
| **Scalability** | 🟢 Unlimited | 🟢 100 TB/school |
| **Built-in preview** | 🔴 Need to build viewer | 🟢 Google Docs viewer for free |

### 🎯 My Recommendation

| Approach | When to Use |
|---|---|
| **Google Drive only** | If you want **$0 cost** and every school has Google Workspace. Best for MVP/early stage. |
| **Cloudflare R2 only** | If you want **full control**, professional infrastructure, and are OK paying ~₹5,000/mo at scale. |
| **Hybrid (best)** | Use **Google Drive as primary** (free), fall back to **R2 for schools without Google Workspace**. Best of both worlds. |

### Hybrid Approach Cost

```
90 schools with Google Workspace  → Storage cost: $0
10 schools without                → Storage on R2: ~$6/month
Supabase DB (metadata)            → $25/month (existing plan)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL for 100 schools: ~$31/month (₹2,500/month) ✅
```

> [!TIP]
> **That's ₹25 per school per month** to serve content to 100,000 students. Practically free.
