import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CANONICAL_GOVERNMENT_WARNING } from '@/lib/validation';
import { VerificationResult } from '@/lib/types';

export const maxDuration = 8;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SCAN_PROMPT = `You are a TTB alcohol label compliance inspector. Read this label image and check it for TTB compliance.

REQUIRED FIELDS — check each is present and readable:
- brandName: brand/product name
- classType: class or type designation
- alcoholContent: ABV percentage (format: "XX% Alc./Vol.")
- netContents: bottle volume (format: "XXX mL" or "X L")
- bottlerInfo: bottler/producer name and address
- countryOfOrigin: country (required for imports, optional for domestic)

GOVERNMENT WARNING — EXACT compliance check:
The label MUST contain this exact text, word-for-word:
"${CANONICAL_GOVERNMENT_WARNING}"
Rules: "GOVERNMENT WARNING:" must be ALL CAPS. Any deviation in wording, capitalization of the header, truncation, or missing words = FAIL.

RETURN only valid JSON:
{
  "overallStatus": "approved" | "rejected" | "needs_review",
  "fields": [
    {
      "field": "brandName",
      "status": "pass" | "fail" | "warning" | "unreadable",
      "labelValue": "<exact text from label>",
      "matchType": "fuzzy" | "exact",
      "note": "<reason for fail/warning if applicable>"
    }
  ],
  "imageQualityNote": ""
}

overallStatus: "approved"=all pass, "rejected"=any fail, "needs_review"=warning/unreadable only.
For governmentWarning field use matchType "exact". All other fields use "fuzzy".
Mark a field "fail" if absent or clearly non-compliant. Mark "warning" if present but formatting is questionable.`;

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const imageFile = formData.get('image') as File | null;
  if (!imageFile) {
    return NextResponse.json({ error: 'Missing required field: image' }, { status: 400 });
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(imageFile.type)) {
    return NextResponse.json({ error: `Unsupported image type: ${imageFile.type}` }, { status: 400 });
  }

  const start = Date.now();
  const bytes = await imageFile.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 512,
      messages: [
        { role: 'system', content: SCAN_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${imageFile.type};base64,${base64}`, detail: 'low' } },
            { type: 'text', text: 'Check this label for TTB compliance.' },
          ],
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content ?? '';
    const raw = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed: Omit<VerificationResult, 'processingTimeMs'>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Could not read label', detail: 'Model returned invalid JSON' }, { status: 422 });
    }

    // Merge applicationValue as the canonical reference for gov warning, blank for others
    const result: VerificationResult = {
      ...parsed,
      processingTimeMs: Date.now() - start,
      fields: parsed.fields.map((f) => ({
        ...f,
        applicationValue: f.field === 'governmentWarning' ? CANONICAL_GOVERNMENT_WARNING : '',
      })),
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
