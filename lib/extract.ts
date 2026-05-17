import OpenAI from 'openai';
import { ApplicationData } from './types';
import { CANONICAL_GOVERNMENT_WARNING } from './validation';


const EXTRACT_PROMPT = `Extract alcohol label fields exactly as shown. Return ONLY valid JSON, no markdown.

{"brandName":"","classType":"","alcoholContent":"","netContents":"","bottlerInfo":"","countryOfOrigin":"","governmentWarning":""}

Copy text verbatim. Use empty string if a field is missing or unreadable.`;

export async function extractLabel(
  imageBase64: string,
  mimeType: string
): Promise<ApplicationData> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validMimeTypes.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 256,
    messages: [
      { role: 'system', content: EXTRACT_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'low' },
          },
          {
            type: 'text',
            text: 'Extract all label fields from this image.',
          },
        ],
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content ?? '';
  const raw = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: ApplicationData;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Model returned invalid JSON');
  }

  return {
    brandName: parsed.brandName ?? '',
    classType: parsed.classType ?? '',
    alcoholContent: parsed.alcoholContent ?? '',
    netContents: parsed.netContents ?? '',
    bottlerInfo: parsed.bottlerInfo ?? '',
    countryOfOrigin: parsed.countryOfOrigin ?? '',
    governmentWarning: parsed.governmentWarning || CANONICAL_GOVERNMENT_WARNING,
  };
}
