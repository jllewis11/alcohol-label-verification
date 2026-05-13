import OpenAI from 'openai';
import { ApplicationData, FieldResult, VerificationResult } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `TTB label compliance check. Read the label image, compare each field to the application data provided.

MATCHING: brandName/classType/alcoholContent/netContents/bottlerInfo/countryOfOrigin = fuzzy (ignore case, minor formatting). governmentWarning = EXACT — must be word-for-word with "GOVERNMENT WARNING:" in ALL CAPS; any deviation, truncation, or title-case header = FAIL.

If a field is unreadable set status "unreadable". If overall image is illegible set imageQualityNote.

Return ONLY valid JSON:
{"overallStatus":"approved"|"rejected"|"needs_review","fields":[{"field":"brandName","status":"pass"|"fail"|"warning"|"unreadable","labelValue":"","matchType":"fuzzy"|"exact","note":""}],"imageQualityNote":""}

overallStatus: "approved"=all pass, "rejected"=any fail, "needs_review"=warning/unreadable only.`;

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
    max_tokens: 512,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'low' },
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
