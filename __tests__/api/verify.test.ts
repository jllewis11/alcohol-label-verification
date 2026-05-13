import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/verify/route';
import { NextRequest } from 'next/server';

vi.mock('../../lib/verify', () => ({
  verifyLabel: vi.fn().mockResolvedValue({
    overallStatus: 'approved',
    fields: [],
    processingTimeMs: 1000,
  }),
}));

function makeRequest(parts: { image?: File; applicationData?: string }): NextRequest {
  const fd = new FormData();
  if (parts.image) fd.append('image', parts.image);
  if (parts.applicationData !== undefined) fd.append('applicationData', parts.applicationData);

  return new NextRequest('http://localhost/api/verify', {
    method: 'POST',
    body: fd,
  });
}

const validAppData = JSON.stringify({
  brandName: "Stone's Throw",
  classType: 'American Whiskey',
  alcoholContent: '45% Alc./Vol.',
  netContents: '750 mL',
  bottlerInfo: 'Bottled by XYZ',
  governmentWarning: 'GOVERNMENT WARNING: ...',
});

const validImage = new File(['fake-image-data'], 'label.jpg', { type: 'image/jpeg' });

describe('POST /api/verify', () => {
  it('returns 400 if image is missing', async () => {
    const req = makeRequest({ applicationData: validAppData });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/image/i);
  });

  it('returns 400 if applicationData is missing', async () => {
    const req = makeRequest({ image: validImage });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/applicationData/i);
  });

  it('returns VerificationResult shape on valid input', async () => {
    const req = makeRequest({ image: validImage, applicationData: validAppData });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('overallStatus');
    expect(json).toHaveProperty('fields');
    expect(json).toHaveProperty('processingTimeMs');
  });

  it('responds in under 8000ms', async () => {
    const start = Date.now();
    const req = makeRequest({ image: validImage, applicationData: validAppData });
    await POST(req);
    expect(Date.now() - start).toBeLessThan(8000);
  });
});
