export const CANONICAL_GOVERNMENT_WARNING = `GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.`;

export function validateWarningFormat(warningText: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  if (!warningText.startsWith('GOVERNMENT WARNING:')) {
    issues.push('"GOVERNMENT WARNING:" must be in all caps at the start');
  }
  if (warningText !== CANONICAL_GOVERNMENT_WARNING) {
    issues.push('Warning text does not match the canonical TTB statement word-for-word');
  }
  return { valid: issues.length === 0, issues };
}
