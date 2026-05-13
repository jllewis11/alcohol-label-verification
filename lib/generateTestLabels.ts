import { ApplicationData } from './types';
import { CANONICAL_GOVERNMENT_WARNING } from './validation';

export interface TestLabel {
  id: number;
  scenarioName: string;
  expectedStatus: 'approved' | 'rejected' | 'needs_review';
  imageBase64: string;
  applicationData: ApplicationData;
}

interface DrawConfig {
  brand: string;
  classType: string;
  abv: string;
  volume: string;
  bottler: string;
  country: string;
  warning: string;
  canvasSize?: { w: number; h: number };
}

const BASE_PRODUCTS = [
  { brand: "STONE'S THROW", classType: 'American Bourbon Whiskey', abv: '45% Alc./Vol. (90 Proof)', volume: '750 mL', bottler: "Bottled by Stone's Throw Distillery, Louisville, KY 40202", country: 'USA' },
  { brand: 'BLUE RIDGE', classType: 'Tennessee Whiskey', abv: '40% Alc./Vol. (80 Proof)', volume: '750 mL', bottler: 'Bottled by Blue Ridge Spirits Co., Nashville, TN 37201', country: 'USA' },
  { brand: 'COPPER STILL', classType: 'Straight Rye Whiskey', abv: '50% Alc./Vol. (100 Proof)', volume: '750 mL', bottler: 'Bottled by Copper Still Craft Spirits, Austin, TX 78701', country: 'USA' },
  { brand: 'HIGHLAND MIST', classType: 'Blended Scotch Whisky', abv: '43% Alc./Vol. (86 Proof)', volume: '750 mL', bottler: 'Imported by Highland Mist USA LLC, New York, NY 10001', country: 'Scotland' },
  { brand: 'CASA REAL', classType: 'Tequila Blanco', abv: '38% Alc./Vol. (76 Proof)', volume: '750 mL', bottler: 'Imported by Casa Real Imports, San Antonio, TX 78205', country: 'Mexico' },
  { brand: 'MOUNT PLEASANT', classType: 'American Vodka', abv: '40% Alc./Vol. (80 Proof)', volume: '1 L', bottler: 'Bottled by Mount Pleasant Distillers, Portland, OR 97201', country: 'USA' },
  { brand: 'IRON GATE', classType: 'Dark Rum', abv: '35% Alc./Vol. (70 Proof)', volume: '750 mL', bottler: 'Imported by Iron Gate Beverages Inc., Miami, FL 33101', country: 'Puerto Rico' },
  { brand: 'SILVER PEAK', classType: 'American Gin', abv: '47% Alc./Vol. (94 Proof)', volume: '750 mL', bottler: 'Bottled by Silver Peak Craft Distillery, Denver, CO 80202', country: 'USA' },
  { brand: 'BELLMONT', classType: 'Brandy', abv: '36% Alc./Vol. (72 Proof)', volume: '750 mL', bottler: 'Bottled by Bellmont Wine & Spirits, Sacramento, CA 95814', country: 'USA' },
  { brand: 'HARBOR LIGHT', classType: 'Blended Whiskey', abv: '40% Alc./Vol. (80 Proof)', volume: '750 mL', bottler: 'Bottled by Harbor Light Distilling Co., Boston, MA 02101', country: 'USA' },
];

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const testLine = line + word + ' ';
    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

function drawLabel(config: DrawConfig): string {
  const w = config.canvasSize?.w ?? 420;
  const h = config.canvasSize?.h ?? 620;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#fffff8';
  ctx.fillRect(0, 0, w, h);

  // Outer border
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#4a4a6a';
  ctx.strokeRect(14, 14, w - 28, h - 28);

  const pad = 28;
  let y = 42;

  // Brand name
  ctx.fillStyle = '#0d0d1a';
  ctx.font = `bold ${Math.floor(w * 0.09)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(config.brand, w / 2, y + Math.floor(w * 0.09));
  y += Math.floor(w * 0.09) + 16;

  // Decorative rule
  ctx.strokeStyle = '#4a4a6a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(w - pad, y);
  ctx.stroke();
  y += 12;

  // Class/type
  ctx.font = `${Math.floor(w * 0.052)}px Georgia, serif`;
  ctx.fillStyle = '#2a2a4a';
  ctx.fillText(config.classType, w / 2, y + Math.floor(w * 0.052));
  y += Math.floor(w * 0.052) + 14;

  // ABV + Volume row
  ctx.font = `bold ${Math.floor(w * 0.044)}px Arial, sans-serif`;
  ctx.fillStyle = '#1a1a2e';
  ctx.textAlign = 'left';
  ctx.fillText(config.abv, pad, y + Math.floor(w * 0.044));
  ctx.textAlign = 'right';
  ctx.fillText(config.volume, w - pad, y + Math.floor(w * 0.044));
  y += Math.floor(w * 0.044) + 10;

  // Decorative rule
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(w - pad, y);
  ctx.stroke();
  y += 10;

  // Country of origin
  if (config.country) {
    ctx.font = `${Math.floor(w * 0.037)}px Arial, sans-serif`;
    ctx.fillStyle = '#444466';
    ctx.textAlign = 'center';
    ctx.fillText(`Product of ${config.country}`, w / 2, y + Math.floor(w * 0.037));
    y += Math.floor(w * 0.037) + 12;
  }

  // Bottler info
  ctx.font = `${Math.floor(w * 0.033)}px Arial, sans-serif`;
  ctx.fillStyle = '#333355';
  ctx.textAlign = 'center';
  y = wrapText(ctx, config.bottler, w / 2, y, w - pad * 2, Math.floor(w * 0.038));
  y += 8;

  // Government warning section
  const warningAreaTop = y;
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(pad, warningAreaTop);
  ctx.lineTo(w - pad, warningAreaTop);
  ctx.stroke();
  y += 10;

  ctx.font = `bold ${Math.floor(w * 0.028)}px Arial, sans-serif`;
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'left';
  wrapText(ctx, config.warning, pad, y, w - pad * 2, Math.floor(w * 0.034));

  return canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
}

export function generateTestLabels(totalCount = 100): TestLabel[] {
  const labels: TestLabel[] = [];
  let id = 0;

  const makeLabel = (
    product: typeof BASE_PRODUCTS[0],
    scenarioName: string,
    expectedStatus: TestLabel['expectedStatus'],
    imageOverrides: Partial<DrawConfig>,
    appDataOverrides: Partial<ApplicationData>
  ): TestLabel => {
    const drawCfg: DrawConfig = {
      brand: product.brand,
      classType: product.classType,
      abv: product.abv,
      volume: product.volume,
      bottler: product.bottler,
      country: product.country,
      warning: CANONICAL_GOVERNMENT_WARNING,
      ...imageOverrides,
    };
    const appData: ApplicationData = {
      brandName: product.brand,
      classType: product.classType,
      alcoholContent: product.abv,
      netContents: product.volume,
      bottlerInfo: product.bottler,
      countryOfOrigin: product.country,
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
      ...appDataOverrides,
    };
    return {
      id: id++,
      scenarioName,
      expectedStatus,
      imageBase64: drawLabel(drawCfg),
      applicationData: appData,
    };
  };

  const fuzzyVolumeMap: Record<string, string> = { '750 mL': '750ml', '1 L': '1l' };
  const fuzzyAbvMap = (abv: string) => abv.replace('Alc./Vol.', 'alc/vol').toLowerCase();
  const wrongAbvMap: Record<string, string> = {
    '45% Alc./Vol. (90 Proof)': '40% Alc./Vol. (80 Proof)',
    '40% Alc./Vol. (80 Proof)': '35% Alc./Vol. (70 Proof)',
    '50% Alc./Vol. (100 Proof)': '46% Alc./Vol. (92 Proof)',
    '43% Alc./Vol. (86 Proof)': '40% Alc./Vol. (80 Proof)',
    '38% Alc./Vol. (76 Proof)': '35% Alc./Vol. (70 Proof)',
    '47% Alc./Vol. (94 Proof)': '43% Alc./Vol. (86 Proof)',
    '35% Alc./Vol. (70 Proof)': '40% Alc./Vol. (80 Proof)',
    '36% Alc./Vol. (72 Proof)': '40% Alc./Vol. (80 Proof)',
  };
  const wrongBrands = ['SUNSET VALLEY', 'GOLDEN OAK', 'SILVER CREEK', 'IRON HORSE', 'PINE RIDGE',
    'CEDAR FALLS', 'RIVER BEND', 'MOUNTAIN VIEW', 'LAKESIDE', 'PRAIRIE WIND'];
  const titleCaseWarning = CANONICAL_GOVERNMENT_WARNING.replace('GOVERNMENT WARNING:', 'Government Warning:');
  const truncatedWarning = 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects.';
  const wrongVolumeMap: Record<string, string> = { '750 mL': '700 mL', '1 L': '750 mL' };
  const swapState = (bottler: string) => bottler
    .replace(', KY ', ', TN ').replace(', TN ', ', GA ').replace(', TX ', ', NM ')
    .replace(', OR ', ', WA ').replace(', FL ', ', GA ').replace(', CO ', ', UT ')
    .replace(', CA ', ', AZ ').replace(', MA ', ', CT ').replace(', NY ', ', NJ ');
  const alteredWarning = CANONICAL_GOVERNMENT_WARNING.replace('impairs your ability', 'affects your ability');

  // 10 scenario builders — each takes an index i to pick the product/variant
  type ScenarioFn = (i: number) => { scenarioName: string; expectedStatus: TestLabel['expectedStatus']; imageOverrides: Partial<DrawConfig>; appDataOverrides: Partial<ApplicationData> };

  const scenarios: ScenarioFn[] = [
    (i) => ({ scenarioName: 'Perfect Match', expectedStatus: 'approved', imageOverrides: {}, appDataOverrides: {} } as ReturnType<ScenarioFn>),
    (i) => {
      const p = BASE_PRODUCTS[i % BASE_PRODUCTS.length];
      return { scenarioName: 'Fuzzy Formatting', expectedStatus: 'approved', imageOverrides: { volume: fuzzyVolumeMap[p.volume] ?? p.volume, abv: fuzzyAbvMap(p.abv) }, appDataOverrides: {} };
    },
    (i) => {
      const p = BASE_PRODUCTS[i % BASE_PRODUCTS.length];
      return { scenarioName: 'Wrong ABV', expectedStatus: 'rejected', imageOverrides: { abv: wrongAbvMap[p.abv] ?? '35% Alc./Vol. (70 Proof)' }, appDataOverrides: {} };
    },
    (i) => ({ scenarioName: 'Wrong Brand', expectedStatus: 'rejected', imageOverrides: { brand: wrongBrands[i % wrongBrands.length] }, appDataOverrides: {} } as ReturnType<ScenarioFn>),
    (i) => ({ scenarioName: 'Title-Case Warning', expectedStatus: 'rejected', imageOverrides: { warning: titleCaseWarning }, appDataOverrides: {} } as ReturnType<ScenarioFn>),
    (i) => ({ scenarioName: 'Truncated Warning', expectedStatus: 'rejected', imageOverrides: { warning: truncatedWarning }, appDataOverrides: {} } as ReturnType<ScenarioFn>),
    (i) => {
      const p = BASE_PRODUCTS[i % BASE_PRODUCTS.length];
      return { scenarioName: 'Wrong Net Contents', expectedStatus: 'rejected', imageOverrides: { volume: wrongVolumeMap[p.volume] ?? '700 mL' }, appDataOverrides: {} };
    },
    (i) => {
      const p = BASE_PRODUCTS[i % BASE_PRODUCTS.length];
      return { scenarioName: 'Wrong Bottler State', expectedStatus: 'rejected', imageOverrides: { bottler: swapState(p.bottler) }, appDataOverrides: {} };
    },
    (i) => ({ scenarioName: 'Altered Warning Wording', expectedStatus: 'rejected', imageOverrides: { warning: alteredWarning }, appDataOverrides: {} } as ReturnType<ScenarioFn>),
    (i) => ({ scenarioName: 'Small/Illegible Label', expectedStatus: 'needs_review', imageOverrides: { canvasSize: { w: 80, h: 120 } }, appDataOverrides: {} } as ReturnType<ScenarioFn>),
  ];

  // Distribute totalCount across 10 scenarios as evenly as possible
  const perScenario = Math.floor(totalCount / scenarios.length);
  const remainder = totalCount % scenarios.length;

  scenarios.forEach((scenarioFn, sIdx) => {
    const count = perScenario + (sIdx < remainder ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const p = BASE_PRODUCTS[(sIdx * 7 + i) % BASE_PRODUCTS.length];
      const { scenarioName, expectedStatus, imageOverrides, appDataOverrides } = scenarioFn(i);
      labels.push(makeLabel(p, scenarioName, expectedStatus, imageOverrides, appDataOverrides));
    }
  });

  return labels;
}
