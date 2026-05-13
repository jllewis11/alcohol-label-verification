import { describe, it, expect } from 'vitest';
import { validateWarningFormat, CANONICAL_GOVERNMENT_WARNING } from '../lib/validation';

describe('validateWarningFormat', () => {
  it('passes canonical warning text', () => {
    const result = validateWarningFormat(CANONICAL_GOVERNMENT_WARNING);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('fails title-case "Government Warning:"', () => {
    const bad = CANONICAL_GOVERNMENT_WARNING.replace('GOVERNMENT WARNING:', 'Government Warning:');
    const result = validateWarningFormat(bad);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('fails truncated warning text', () => {
    const truncated = CANONICAL_GOVERNMENT_WARNING.substring(0, 50);
    const result = validateWarningFormat(truncated);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Warning text does not match the canonical TTB statement word-for-word');
  });

  it('fails missing GOVERNMENT WARNING: prefix', () => {
    const noPrefix = CANONICAL_GOVERNMENT_WARNING.replace('GOVERNMENT WARNING: ', '');
    const result = validateWarningFormat(noPrefix);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('"GOVERNMENT WARNING:" must be in all caps at the start');
  });
});
