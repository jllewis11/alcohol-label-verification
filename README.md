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

### Problem framing

The core task is: given a label image and a set of application data fields, determine whether each field on the physical label matches what was approved. The prior vendor solved this with template-based OCR (30–40 seconds per label, high failure rate on non-standard layouts). The goal was to get this under 5 seconds with acceptable accuracy for a human-reviewed workflow.

### Architecture

The system is a Next.js API layer in front of GPT-4o. Each verification is a single POST to `/api/verify` — the image (base64) and application data are sent together, and the model returns a structured JSON result with a pass/fail/warning/unreadable status for each field. No intermediate storage; no pipeline. This keeps the critical path to one network round-trip.

Batch verification (`/api/verify-batch`) fans out requests concurrently using `Promise.allSettled` and streams results back as NDJSON. Clients see each label resolve in real time rather than waiting for the slowest one. One failure does not block others.

Camera auto-fill is a separate `/api/extract` call before verification. The agent photographs the bottle, the model reads all seven fields from the image, and the form pre-populates. The agent reviews and corrects before submitting — eliminating manual data entry without removing human oversight.

### Matching logic

Most fields use **fuzzy matching**: GPT-4o is instructed to accept minor formatting differences (`750ml` vs `750 mL`, `alc/vol` vs `Alc./Vol.`, `Stone's Throw` vs `STONE'S THROW`). This reflects how agents actually evaluate labels — a formatting difference is not a compliance failure.

The **Government Warning Statement** is exact-match only. TTB requires the statement word-for-word with `GOVERNMENT WARNING:` in ALL CAPS, bold, and no less prominent than other text. Any deviation — title case, truncation, altered wording, buried placement — is a genuine compliance failure, not a formatting difference. The canonical text is pre-filled in every form so agents never have to type it.

### Degraded images

If GPT-4o cannot read a field (blur, glare, angle, small print), it returns `"unreadable"` for that field rather than guessing. The overall status becomes `needs_review`. Agents see exactly which fields were unreadable. This avoids false passes on low-quality images.

---

## Tools Used

| Tool | Why this, not something else |
|---|---|
| **GPT-4o (vision)** | Handles arbitrary label layouts, fonts, and image quality in a single API call. Template-based OCR requires per-label training and breaks on layout variation. Dedicated document AI services (Textract, Document AI) extract text but don't compare it to a reference — a second model call would still be needed, doubling latency. |
| **Next.js 16 (App Router)** | Unified framework for API routes and React UI. Server components and route handlers eliminate a separate backend service. App Router's streaming support enables NDJSON batch progress without WebSockets. |
| **TypeScript** | End-to-end type safety across API contracts, model response parsing, and UI state. Catches shape mismatches between what the model returns and what the UI expects at compile time. |
| **Tailwind CSS** | Utility-first styling with no build step complexity. Sufficient for a prototype-grade UI that needs to look professional but doesn't require a design system. |
| **Vercel** | Zero-config deployment for Next.js. Routes requests through Vercel's infrastructure, bypassing agency firewall restrictions that blocked the prior vendor's local-install approach. Serverless functions handle variable load without capacity planning. |
| **Vitest** | Fast unit test runner compatible with TypeScript and ESM. Tests cover validation logic and verification result parsing — the parts most likely to break silently on edge cases. |

---

## Assumptions

These are decisions made based on the available context that would need revisiting in a production system:

- **Human review is always required.** The system outputs approved / rejected / needs\_review, but every result is intended to be reviewed by a TTB agent before action is taken. The model's accuracy is high enough for triage, not for autonomous approval.
- **Images are submitted one label at a time.** Multi-label bottles (front + back) are handled by separate uploads. The model reads whatever is in the frame.
- **Application data is known before verification.** The workflow assumes an agent has the approved application data and is checking whether a physical label matches it. The system does not retrieve application data from COLA or any external source.
- **Seven fields cover the required compliance check.** The verified fields are: brand name, class/type, alcohol content, net contents, bottler information, country of origin, and government warning. Additional TTB-required elements (lot number, certificate of label approval number, etc.) are out of scope for this prototype.
- **A shared password is an acceptable auth model for a pilot.** A small known set of TTB agents will access the tool. Production deployment would require agency SSO or PIV-card authentication.
- **Latency target is 5 seconds per label.** This was the stated requirement and the primary design constraint. All architectural choices (single API call, concurrent batch, no intermediate storage) flow from this.
- **The government warning text is fixed.** The canonical FABA warning statement is hardcoded in `lib/validation.ts`. If TTB updates the required text, that constant must be updated manually.

---

## Known Limitations

- **Agency network firewalls** may block outbound calls to `api.openai.com` from local machines. The deployed Vercel URL routes around this — agents should use the web URL.
- **Image quality floor**: severely blurred or occluded labels return `needs_review` on affected fields rather than a confident result. Good lighting and a flat surface improve accuracy significantly.
- **No COLA integration**: application data must be entered manually or auto-filled via camera. A CSV import or direct COLA API integration is out of scope for this prototype.
- **No persistent storage**: fully stateless. No images or results are retained between sessions.
- **Batch data entry overhead**: each image in a batch requires its own application data form. For large importer batches (200–300 labels), a CSV bulk-import flow would be needed.
- **Rate limiting is in-memory**: the 5-requests-per-hour batch limit resets on server restart and does not coordinate across multiple instances. Sufficient for a prototype; a production system would use a distributed store (Redis, etc.).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Vision AI | OpenAI GPT-4o |
| Auth | Shared password cookie |
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
