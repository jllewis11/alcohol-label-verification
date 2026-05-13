import { NextRequest } from 'next/server';
import { verifyLabel } from '@/lib/verify';
import { ApplicationData, VerificationResult } from '@/lib/types';

export const maxDuration = 60;

interface BatchItem {
  imageBase64: string;
  applicationData: ApplicationData;
  mimeType: string;
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form data' }), { status: 400 });
  }

  const itemsRaw = formData.get('items') as string | null;
  if (!itemsRaw) {
    return new Response(JSON.stringify({ error: 'Missing required field: items' }), { status: 400 });
  }

  let items: BatchItem[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return new Response(JSON.stringify({ error: 'items must be valid JSON array' }), { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ error: 'items must be a non-empty array' }), { status: 400 });
  }

  const MAX_BATCH = 100;
  const limited = items.slice(0, MAX_BATCH);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const results = await Promise.allSettled(
        limited.map((item, index) =>
          verifyLabel(item.imageBase64, item.mimeType || 'image/jpeg', item.applicationData)
            .then((result) => ({ index, result, error: null }))
            .catch((err) => ({
              index,
              result: null,
              error: err instanceof Error ? err.message : 'Unknown error',
            }))
        )
      );

      for (const settled of results) {
        if (settled.status === 'fulfilled') {
          const line = JSON.stringify(settled.value) + '\n';
          controller.enqueue(encoder.encode(line));
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
    },
  });
}
