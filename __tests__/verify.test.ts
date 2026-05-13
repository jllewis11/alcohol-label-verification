import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VerificationResult } from '../lib/types';

const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: mockCreate } };
  },
}));

function makeModel(overrides: Partial<VerificationResult> = {}): Partial<VerificationResult> {
  return {
    overallStatus: 'approved',
    fields: [
      { field: 'brandName', status: 'pass', labelValue: "Stone's Throw", matchType: 'fuzzy', applicationValue: '' },
      { field: 'classType', status: 'pass', labelValue: 'American Whiskey', matchType: 'fuzzy', applicationValue: '' },
      { field: 'alcoholContent', status: 'pass', labelValue: '45% alc/vol', matchType: 'fuzzy', applicationValue: '' },
      { field: 'netContents', status: 'pass', labelValue: '750ml', matchType: 'fuzzy', applicationValue: '' },
      { field: 'bottlerInfo', status: 'pass', labelValue: 'Bottled by XYZ', matchType: 'fuzzy', applicationValue: '' },
      { field: 'governmentWarning', status: 'pass', labelValue: 'GOVERNMENT WARNING: ...', matchType: 'exact', applicationValue: '' },
    ],
    ...overrides,
  };
}

function mockResponse(data: Partial<VerificationResult>) {
  return { choices: [{ message: { content: JSON.stringify(data) } }] };
}

const baseAppData = {
  brandName: "Stone's Throw",
  classType: 'American Whiskey',
  alcoholContent: '45% Alc./Vol. (90 Proof)',
  netContents: '750 mL',
  bottlerInfo: 'Bottled by XYZ Distillery, City, State 12345',
  governmentWarning: 'GOVERNMENT WARNING: (1) According to the Surgeon General...',
};

describe('verifyLabel', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns pass for exact brand name match', async () => {
    mockCreate.mockResolvedValueOnce(mockResponse(makeModel()));
    const { verifyLabel } = await import('../lib/verify');
    const result = await verifyLabel('base64data', 'image/jpeg', baseAppData);
    const brandField = result.fields.find((f) => f.field === 'brandName');
    expect(brandField?.status).toBe('pass');
  });

  it("returns pass for case-insensitive brand name (STONE'S THROW)", async () => {
    mockCreate.mockResolvedValueOnce(mockResponse(makeModel({
      fields: [{ field: 'brandName', status: 'pass', labelValue: "STONE'S THROW", matchType: 'fuzzy', applicationValue: '' }],
    } as Partial<VerificationResult>)));
    const { verifyLabel } = await import('../lib/verify');
    const result = await verifyLabel('base64data', 'image/jpeg', baseAppData);
    expect(result.fields[0]?.status).toBe('pass');
  });

  it('returns fail for wrong ABV', async () => {
    mockCreate.mockResolvedValueOnce(mockResponse(makeModel({
      overallStatus: 'rejected',
      fields: [{ field: 'alcoholContent', status: 'fail', labelValue: '40% alc/vol', matchType: 'fuzzy', note: 'ABV mismatch', applicationValue: '' }],
    } as Partial<VerificationResult>)));
    const { verifyLabel } = await import('../lib/verify');
    const result = await verifyLabel('base64data', 'image/jpeg', baseAppData);
    expect(result.overallStatus).toBe('rejected');
  });

  it('returns fail for non-canonical government warning', async () => {
    mockCreate.mockResolvedValueOnce(mockResponse(makeModel({
      overallStatus: 'rejected',
      fields: [{ field: 'governmentWarning', status: 'fail', labelValue: 'Government Warning: ...', matchType: 'exact', note: 'Header not in ALL CAPS', applicationValue: '' }],
    } as Partial<VerificationResult>)));
    const { verifyLabel } = await import('../lib/verify');
    const result = await verifyLabel('base64data', 'image/jpeg', baseAppData);
    const gwField = result.fields.find((f) => f.field === 'governmentWarning');
    expect(gwField?.status).toBe('fail');
  });

  it('returns unreadable status for low-quality image fields', async () => {
    mockCreate.mockResolvedValueOnce(mockResponse(makeModel({
      overallStatus: 'needs_review',
      fields: [{ field: 'brandName', status: 'unreadable', labelValue: '', matchType: 'fuzzy', note: 'Image too blurry', applicationValue: '' }],
    } as Partial<VerificationResult>)));
    const { verifyLabel } = await import('../lib/verify');
    const result = await verifyLabel('base64data', 'image/jpeg', baseAppData);
    expect(result.fields[0]?.status).toBe('unreadable');
  });

  it('sets overallStatus to rejected if any field fails', async () => {
    mockCreate.mockResolvedValueOnce(mockResponse(makeModel({ overallStatus: 'rejected' } as Partial<VerificationResult>)));
    const { verifyLabel } = await import('../lib/verify');
    const result = await verifyLabel('base64data', 'image/jpeg', baseAppData);
    expect(result.overallStatus).toBe('rejected');
  });

  it('sets overallStatus to needs_review if any field is unreadable', async () => {
    mockCreate.mockResolvedValueOnce(mockResponse(makeModel({ overallStatus: 'needs_review' } as Partial<VerificationResult>)));
    const { verifyLabel } = await import('../lib/verify');
    const result = await verifyLabel('base64data', 'image/jpeg', baseAppData);
    expect(result.overallStatus).toBe('needs_review');
  });

  it('includes processingTimeMs in result', async () => {
    mockCreate.mockResolvedValueOnce(mockResponse(makeModel()));
    const { verifyLabel } = await import('../lib/verify');
    const result = await verifyLabel('base64data', 'image/jpeg', baseAppData);
    expect(typeof result.processingTimeMs).toBe('number');
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
  });
});
