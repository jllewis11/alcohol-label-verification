# TTB Label Verification

An AI-powered alcohol label compliance verification tool for TTB compliance agents. Upload or photograph a label, and the system checks it against application data in under 5 seconds.

## Live Demo

**https://ttb-label-verification-pink.vercel.app**

Access is password-protected. Contact the project owner for the access code.

---

## Setup

### Prerequisites
- Node.js 18+
- OpenAI API key (GPT-4o access required)

### Install & Run

```bash
npm install
```

Create `.env.local` in the project root:

```bash
OPENAI_API_KEY=sk-your-key-here
APP_PASSWORD=your-access-password
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter the access password.

### Run Tests

```bash
npm test
```

---

## What It Does

### Single Label Verification (`/`)

1. Upload a label image (JPG, PNG, WebP) **or** use the camera to photograph a bottle
2. When using the camera, GPT-4o auto-fills all application data fields by reading the label — no typing required
3. Review the pre-filled fields, correct any errors, and click **Verify Label**
4. Results appear in under 5 seconds showing pass/fail for each field and an overall status

### Batch Verification (`/batch`)

- Upload multiple label images at once, fill in application data per image, and verify all simultaneously
- Results stream back as each label completes — one failure does not block others
- Summary shows approved / rejected / needs review counts

### Stress Test (on batch page)

- Generates synthetic test labels (configurable: 20–500 labels, batch size 5–100) entirely in-browser
- Runs all batches concurrently — 100 labels typically complete in ~5–8 seconds
- Grid view shows pass/fail per label; hover to see the generated label image and field details

---

## Approach

### Why GPT-4o

GPT-4o's vision capability handles the core task — reading a label image and comparing fields — in a single API call. The prior vendor's scanning approach (30–40 seconds per label) failed adoption. GPT-4o consistently returns results in 3–5 seconds.

A single model call per label was chosen deliberately over multi-pass approaches (e.g., extract then verify) to stay within the 5-second target. The accuracy tradeoff is acceptable for a prototype where a human agent reviews every result.

### Matching Logic

Most fields use **fuzzy matching** — GPT-4o is instructed to accept minor formatting differences like `750ml` vs `750 mL`, or `alc/vol` vs `Alc./Vol.`. This addresses the real agent concern (Dave Morrison's example: `STONE'S THROW` vs `Stone's Throw` should pass) while still catching genuine errors.

The **Government Warning Statement** uses exact matching. Per TTB regulation and agent feedback (Jenny Park), the statement must be word-for-word with `GOVERNMENT WARNING:` in ALL CAPS. Any deviation — title case, truncation, altered wording, or the header buried in small print — is a hard fail. The canonical warning is pre-filled in the form so agents never have to type it.

### Camera Auto-Fill

When an agent photographs a bottle, a separate `/api/extract` call runs first — GPT-4o reads the label and populates all application data fields automatically. The agent reviews the auto-filled fields before triggering verification. This eliminates the data-entry step that currently consumes much of agents' time.

### Degraded Images

If GPT-4o cannot read a field (blur, glare, angle, small print), it returns `"unreadable"` status rather than guessing. The overall status becomes `needs_review` rather than a false pass or crash. Agents see which specific fields were unreadable and can request a clearer image.

---

## Known Limitations

- **Agency network firewalls** may block outbound connections to OpenAI's API endpoints if the app runs locally on agency machines. The deployed Vercel URL routes through Vercel's infrastructure and bypasses this — agents should use the web URL, not a local install. (Same issue encountered in the prior scanning vendor pilot.)

- **Image quality floor**: very low resolution or heavily obscured images return `needs_review` rather than a confident result. Agents should photograph labels under good lighting, flat against a surface if possible.

- **No COLA integration**: this is a standalone prototype. Application data must be entered manually or auto-filled via camera. Integration with the existing COLA (.NET) system is a future consideration pending authorization requirements.

- **No persistent storage**: the app is fully stateless per security guidance. No label images or application data are stored between sessions. Results exist only in the current browser session.

- **Batch manual data entry**: the batch uploader requires filling in application data for each uploaded image. For large importer batches (200–300 labels), a CSV import or COLA integration would be needed — out of scope for this prototype.

---

## Trade-offs & Assumptions

| Decision | Rationale |
|---|---|
| Single API call per label | Keeps latency under 5 seconds; multi-pass would exceed it |
| GPT-4o over specialized OCR | General vision model handles layout variation and degraded images better than template-based OCR |
| Fuzzy match for most fields | Matches real agent judgment (Dave's case); reduces false rejects on formatting differences |
| Exact match for government warning | Legally mandated text; any deviation is a genuine compliance failure |
| Stateless / no DB | Simplest secure prototype; no PII retained |
| Password-protected with shared secret | Appropriate for a small known set of pilot reviewers; not a production auth solution |
| Vercel deployment | Avoids agency firewall issues; fast global edge network |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Vision AI | OpenAI GPT-4o |
| Auth | Shared password cookie via Next.js proxy |
| Deployment | Vercel |
| Testing | Vitest |

---

## Project Structure

```
app/
  page.tsx              # Single label verification
  batch/page.tsx        # Batch verification + stress test
  login/page.tsx        # Password gate
  api/
    verify/route.ts     # POST /api/verify — single label
    verify-batch/route.ts # POST /api/verify-batch — batch (NDJSON stream)
    extract/route.ts    # POST /api/extract — camera auto-fill
    login/route.ts      # POST /api/login — sets auth cookie

components/
  LabelUploader.tsx     # Drag-and-drop file upload
  CameraCapture.tsx     # Live camera stream with capture
  ApplicationForm.tsx   # 7-field application data form
  VerificationResult.tsx # Per-field results display
  BatchUploader.tsx     # Multi-file upload with inline forms
  BatchProgress.tsx     # Streaming batch results with expandable rows
  TestBatch.tsx         # 100-label stress test with live grid

lib/
  verify.ts             # Core GPT-4o verification call
  extract.ts            # Camera auto-fill extraction call
  validation.ts         # Canonical warning text + client-side pre-check
  types.ts              # Shared TypeScript types
  generateTestLabels.ts # Browser-side synthetic label generator (Canvas API)
```
