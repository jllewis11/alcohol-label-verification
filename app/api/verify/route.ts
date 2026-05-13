import { NextRequest, NextResponse } from 'next/server';
import { verifyLabel } from '@/lib/verify';
import { ApplicationData } from '@/lib/types';

export const maxDuration = 8;

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const imageFile = formData.get('image') as File | null;
  const applicationDataRaw = formData.get('applicationData') as string | null;

  if (!imageFile) {
    return NextResponse.json({ error: 'Missing required field: image' }, { status: 400 });
  }
  if (!applicationDataRaw) {
    return NextResponse.json({ error: 'Missing required field: applicationData' }, { status: 400 });
  }

  let applicationData: ApplicationData;
  try {
    applicationData = JSON.parse(applicationDataRaw);
  } catch {
    return NextResponse.json({ error: 'applicationData must be valid JSON' }, { status: 400 });
  }

  const requiredFields: (keyof ApplicationData)[] = [
    'brandName', 'classType', 'alcoholContent', 'netContents', 'bottlerInfo', 'governmentWarning',
  ];
  for (const field of requiredFields) {
    if (!applicationData[field]) {
      return NextResponse.json({ error: `Missing required applicationData field: ${field}` }, { status: 400 });
    }
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
    const result = await verifyLabel(base64, imageFile.type, applicationData);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    if (message.includes('unreadable') || message.includes('invalid JSON')) {
      return NextResponse.json({ error: 'Image could not be processed', detail: message }, { status: 422 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
