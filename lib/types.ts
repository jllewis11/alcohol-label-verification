export type MatchType = 'fuzzy' | 'exact';
export type FieldStatus = 'pass' | 'fail' | 'warning' | 'unreadable';

export interface ApplicationData {
  brandName: string;
  classType: string;
  alcoholContent: string;
  netContents: string;
  bottlerInfo: string;
  countryOfOrigin?: string;
  governmentWarning: string;
}

export interface FieldResult {
  field: string;
  status: FieldStatus;
  applicationValue: string;
  labelValue: string;
  matchType: MatchType;
  note?: string;
}

export interface VerificationResult {
  overallStatus: 'approved' | 'rejected' | 'needs_review';
  fields: FieldResult[];
  processingTimeMs: number;
  imageQualityNote?: string;
}
