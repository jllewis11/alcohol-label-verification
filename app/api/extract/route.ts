import { NextRequest, NextResponse } from 'next/server';
import { extractLabel } from '@/lib/extract';

export const maxDuration = 8;

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
    return NextResponse.json(
      { error: `Unsupported image type: ${imageFile.type}. Use jpg, png, or webp.` },
      { status: 400 }
    );
  }

  const bytes = await imageFile.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  try {
    const result = await extractLabel(base64, imageFile.type);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    if (message.includes('invalid JSON')) {
      return NextResponse.json({ error: 'Could not read label from image', detail: message }, { status: 422 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
