import OpenAI from 'openai';
import { ApplicationData } from './types';
import { CANONICAL_GOVERNMENT_WARNING } from './validation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EXTRACT_PROMPT = `
You are reading an alcohol beverage label. Extract the following fields exactly as they appear on the label and return them as JSON.

FIELDS TO EXTRACT:
- brandName: the brand or product name
- classType: the class/type designation (e.g. "Scotch Whisky", "American Bourbon Whiskey", "Cabernet Sauvignon")
- alcoholContent: alcohol by volume as shown (e.g. "40% Alc./Vol.", "45% alc/vol (90 Proof)")
- netContents: bottle volume as shown (e.g. "750 mL", "1 L")
- bottlerInfo: bottler, distiller, or producer name and address as shown
- countryOfOrigin: country of origin if shown, otherwise empty string
- governmentWarning: the full Government Warning text exactly as it appears, including the "GOVERNMENT WARNING:" header

RULES:
- Copy text exactly as it appears — do not paraphrase or correct
- If a field is not visible or the image is too blurry to read, use an empty string
- Return only valid JSON, no markdown, no explanation

RESPONSE FORMAT:
{
  "brandName": "",
  "classType": "",
  "alcoholContent": "",
  "netContents": "",
  "bottlerInfo": "",
  "countryOfOrigin": "",
  "governmentWarning": ""
}
`;

export async function extractLabel(
  imageBase64: string,
  mimeType: string
): Promise<ApplicationData> {
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validMimeTypes.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: EXTRACT_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
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
