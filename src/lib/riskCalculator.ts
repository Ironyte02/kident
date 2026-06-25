/**
 * ECC Risk Calculator
 * Logistic regression model trained on 75-record STS questionnaire dataset.
 * 5-fold CV accuracy: 93.3% ± 4.2%
 *
 * Drop `ecc_model.json` into /src/lib/ and import this file.
 * Zero backend needed — pure client-side inference.
 */

import modelData from "./ecc_model.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyEntry {
  // Demographics
  age: number;                  // numeric age in years
  gender: "Boy" | "Girl";

  // Diet
  mainMeals: "2 meals" | "3 meals" | "More than 3 meals";
  sweetsFreq: FreqOption;
  snacksFreq: FreqOption;
  sweetDrinksFreq: FreqOption;
  tiffinFreq: FreqOption;
  healthyFreq: HealthyFreqOption;
  riceRotiFreq: RiceFreqOption;

  // Oral hygiene
  brushFreq: "Rarely/Never" | "Once" | "Twice";
  toothpaste: "Non-fluoride" | "Don't know" | "Fluoride";
  rinseAfterMeals: "Never" | "Rarely" | "Sometimes" | "Always";
  extraCleaning: "No" | "Sometimes" | "Yes, regularly";

  // Fluoride exposure
  waterSource: "Well/borewell" | "Tap/municipal" | "Bottled" | "Filtered (RO/purifier)";
  fluorideTreatment: "No/Don't know" | "Yes";
}

export type FreqOption = "Never/Rarely" | "1-2 times per week" | "3-4 times per week" | "Daily";
export type HealthyFreqOption = "Never/Rarely" | "1 time daily" | "2-3 times daily" | "With every meal";
export type RiceFreqOption = "Never/Rarely" | "1 time daily" | "2 times daily" | "More than 2 times daily";

export type RiskLevel = "low" | "moderate" | "high";

export interface RiskResult {
  score: number;         // 0–100 percentage
  probability: number;   // raw sigmoid output 0–1
  level: RiskLevel;
  recommendations: Recommendation[];
}

export interface Recommendation {
  key: string;
  message_en: string;
  message_ta: string;
}

// ─── Encoding maps (mirrors Python training script) ───────────────────────────

const enc = {
  freq4: { "Never/Rarely": 0, "1-2 times per week": 1, "3-4 times per week": 2, "Daily": 3 },
  healthyFreq: { "Never/Rarely": 0, "1 time daily": 1, "2-3 times daily": 2, "With every meal": 3 },
  riceFreq: { "Never/Rarely": 0, "1 time daily": 1, "2 times daily": 2, "More than 2 times daily": 3 },
  meals: { "2 meals": 0, "3 meals": 1, "More than 3 meals": 2 },
  brush: { "Rarely/Never": 0, "Once": 1, "Twice": 2 },
  toothpaste: { "Non-fluoride": 0, "Don't know": 1, "Fluoride": 2 },
  rinse: { "Never": 0, "Rarely": 1, "Sometimes": 2, "Always": 3 },
  extra: { "No": 0, "Sometimes": 1, "Yes, regularly": 2 },
  water: { "Well/borewell": 0, "Tap/municipal": 1, "Bottled": 2, "Filtered (RO/purifier)": 3 },
  fluoride: { "No/Don't know": 0, "Yes": 1 },
  gender: { "Boy": 0, "Girl": 1 },
} as const;

// ─── Core inference ───────────────────────────────────────────────────────────

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function encodeFeatures(entry: DailyEntry): number[] {
  return [
    Math.min(Math.max(entry.age, 0), 15),                 // age_enc
    enc.gender[entry.gender],                              // gender_enc
    enc.meals[entry.mainMeals],                            // meals_enc
    enc.freq4[entry.sweetsFreq],                           // sweets_enc
    enc.freq4[entry.snacksFreq],                           // snacks_enc
    enc.freq4[entry.sweetDrinksFreq],                      // sweet_drinks_enc
    enc.freq4[entry.tiffinFreq],                           // tiffin_enc
    enc.healthyFreq[entry.healthyFreq],                    // healthy_enc
    enc.riceFreq[entry.riceRotiFreq],                      // rice_enc
    enc.brush[entry.brushFreq],                            // brush_enc
    enc.toothpaste[entry.toothpaste],                      // paste_enc
    enc.rinse[entry.rinseAfterMeals],                      // rinse_enc
    enc.extra[entry.extraCleaning],                        // extra_enc
    enc.water[entry.waterSource],                          // water_enc
    enc.fluoride[entry.fluorideTreatment],                 // fluoride_enc
  ];
}

function scaleFeatures(raw: number[]): number[] {
  const { mean, scale } = modelData.scaler;
  return raw.map((v, i) => (v - mean[i]) / scale[i]);
}

function logisticScore(scaled: number[]): number {
  const { intercept, coefficients } = modelData.model;
  const logit = intercept + scaled.reduce((sum, v, i) => sum + v * coefficients[i], 0);
  return sigmoid(logit);
}

// ─── Recommendation engine ────────────────────────────────────────────────────

function buildRecommendations(entry: DailyEntry, encodedRaw: number[]): Recommendation[] {
  const [age, , , sweets, snacks, sweetDrinks, , , , brush, paste, rinse] = encodedRaw;
  const water = enc.water[entry.waterSource];

  const recs: Recommendation[] = [];
  const r = modelData.recommendations as Record<string, { message_en: string; message_ta: string }>;

  if (sweets >= 2)                        recs.push({ key: "high_sweets",      ...r.high_sweets });
  if (snacks >= 2)                        recs.push({ key: "high_snacks",      ...r.high_snacks });
  if (sweetDrinks >= 2)                   recs.push({ key: "high_sweet_drinks",...r.high_sweet_drinks });
  if (brush <= 1)                         recs.push({ key: "low_brush",        ...r.low_brush });
  if (paste <= 1)                         recs.push({ key: "no_fluoride_paste",...r.no_fluoride_paste });
  if (rinse <= 1)                         recs.push({ key: "low_rinse",        ...r.low_rinse });
  if (water <= 1)                         recs.push({ key: "risky_water",      ...r.risky_water });
  if (age <= 5)                           recs.push({ key: "young_child",      ...r.young_child });

  // Positive reinforcement if everything is good
  if (recs.length === 0) {
    recs.push({ key: "good_habits", ...r.good_habits });
  }

  return recs;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function calculateRisk(entry: DailyEntry): RiskResult {
  const rawFeatures  = encodeFeatures(entry);
  const scaledFeatures = scaleFeatures(rawFeatures);
  const probability  = logisticScore(scaledFeatures);
  const score        = Math.round(probability * 100);
  const level        = getRiskLevel(score);
  const recommendations = buildRecommendations(entry, rawFeatures);

  return { score, probability, level, recommendations };
}

export function getRiskLevel(score: number): RiskLevel {
  if (score < 40) return "low";
  if (score < 70) return "moderate";
  return "high";
}

// ─── Model metadata export (useful for About/debug screens) ──────────────────

export const modelMetadata = {
  cvAccuracy: modelData.metadata.cv_accuracy,
  trainingSamples: 75,
  description: modelData.metadata.description,
  topRiskFactors: ["Sweets frequency", "Snacks frequency", "Sweet drinks frequency"],
  topProtectiveFactors: ["Fluoride toothpaste", "Brushing frequency", "Mouth rinsing"],
};
