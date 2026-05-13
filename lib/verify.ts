import OpenAI from 'openai';
import { ApplicationData, FieldResult, VerificationResult } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) label compliance assistant.
You will be given a label image and application data. Extract each field from the label
and compare it to the application data.

MATCHING RULES:
- Brand Name: fuzzy match — ignore case differences and minor punctuation (e.g. "STONE'S THROW" matches "Stone's Throw")
- Class/Type: fuzzy match — ignore case and spacing
- Alcohol Content: fuzzy match — "45% Alc./Vol. (90 Proof)" matches "45% alc/vol 90 proof"
- Net Contents: fuzzy match — "750 mL" matches "750ml"
- Bottler Info: fuzzy match — same address, minor formatting differences acceptable
- Country of Origin: fuzzy match
- Government Warning: EXACT match required — the label must contain the word-for-word TTB
  Government Health Warning Statement. "GOVERNMENT WARNING:" must appear in ALL CAPS (bold
  formatting is also required per TTB regulation, though you are reading an image so assess
  whether the header text appears prominently/bold relative to surrounding text).
  Any deviation in wording, capitalization of the header, missing words, or header not in
  ALL CAPS = FAIL. Common violations: title-case "Government Warning:", truncated text,
  altered wording, or the statement buried in illegibly small print.

IMAGE QUALITY:
- If the image is too blurry, dark, or obscured to read a field, set that field's status to "unreadable"
- If the overall image quality prevents any meaningful extraction, set imageQualityNote

RESPONSE FORMAT — return only valid JSON, no markdown, no explanation:
{
  "overallStatus": "approved" | "rejected" | "needs_review",
  "fields": [
    {
      "field": "brandName",
      "status": "pass" | "fail" | "warning" | "unreadable",
      "labelValue": "<what you read from the label>",
      "matchType": "fuzzy" | "exact",
      "note": "<optional explanation for fail or warning>"
    }
  ],
  "imageQualityNote": "<optional>"
}

Set overallStatus to:
- "approved" if all fields pass
- "rejected" if any field fails
- "needs_review" if any field is "warning" or "unreadable" with no failures
`;

export async function verifyLabel(
  imageBase64: string,
  mimeType: string,
  applicationData: ApplicationData
): Promise<VerificationResult> {
  const start = Date.now();

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validMimeTypes.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          {
            type: 'text',
            text: `Application data to verify against:\n${JSON.stringify(applicationData, null, 2)}`,
          },
        ],
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content ?? '';
  const raw = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: Omit<VerificationResult, 'processingTimeMs'> & { fields: Omit<FieldResult, 'applicationValue'>[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Model returned invalid JSON');
  }

  return {
    ...parsed,
    processingTimeMs: Date.now() - start,
    fields: parsed.fields.map((f) => ({
      ...f,
      applicationValue: applicationData[f.field as keyof ApplicationData] ?? '',
    })),
  };
}
