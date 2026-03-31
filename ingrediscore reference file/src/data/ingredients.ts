/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ConfidenceLevel = 'Low' | 'Moderate' | 'High';
export type EvidenceType = 'Systematic Review' | 'Meta-analysis' | 'RCT' | 'Observational' | 'Animal/In Vitro' | 'Mixed' | 'Regulatory';
export type HealthStatus = 'Likely Beneficial' | 'Likely Neutral' | 'Mixed Evidence' | 'Potential Concern';
export type StudyQuality = 'High' | 'Moderate' | 'Lower';
export type StudyType = 'Meta-analysis' | 'Systematic Review' | 'Randomized Controlled Trial' | 'Cohort Study' | 'Case-Control Study' | 'Animal Study' | 'In Vitro' | 'Review' | 'Regulatory Report' | 'Clinical Trial' | 'Observational Study';

export interface Study {
  id?: string;
  title: string;
  authors?: string;
  journal?: string;
  year: number;
  type?: StudyType;
  quality?: StudyQuality;
  populationType?: 'Human' | 'Animal' | 'Cell Study';
  sampleSize?: string;
  population?: string;
  design?: string;
  duration?: string;
  keyFindings?: string;
  limitations?: string;
  url: string;
  pmid?: string;
  summary?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  synonyms: string[];
  category: string;
  score: number; // 1-10
  scoreReasoning: string;
  summaryShort: string;
  positives: string[];
  negatives: string[];
  evidenceOverview: string; // Scientific Evidence Overview
  expertSources?: string[]; // Specific reliable sources if studies are limited
  confidenceLevel: ConfidenceLevel;
  evidenceType: EvidenceType;
  studies: Study[]; // Replaces citations
  lastReviewed: string;
  status: HealthStatus;
  // Quality-Weighted Scoring fields
  studyQualitySummary: string;
  regulatoryWeight: number; // 20-40%
  regulatoryConsensus: string;
  evidenceStrength: string;
  humanEvidence: string;
  evolvingEvidence: boolean;
  evolvingEvidenceNote?: string;
  lastScientificRefresh: string;
  updatedAt?: number;
}

export const CATEGORY_MAPPING: Record<string, string> = {
  'Sweeteners': 'Sweeteners',
  'Preservatives': 'Preservatives & Stability',
  'Antioxidants': 'Preservatives & Stability',
  'Acidity Regulators': 'Preservatives & Stability',
  'Additives': 'Preservatives & Stability',
  'Emulsifiers': 'Texture & Consistency',
  'Thickeners/Gums': 'Texture & Consistency',
  'Leavening Agents': 'Texture & Consistency',
  'Enzymes': 'Texture & Consistency',
  'Anti-caking Agents': 'Texture & Consistency',
  'Processing Aids': 'Texture & Consistency',
  'Oils/Fats': 'Oils & Fats',
  'Grains/Starches': 'Grains & Starches',
  'Vitamins/Minerals': 'Vitamins & Nutrients',
  'Nutrients': 'Vitamins & Nutrients',
  'Fibers': 'Vitamins & Nutrients',
  'Cultures': 'Vitamins & Nutrients',
  'Flavorings': 'Flavors & Colors',
  'Flavor Enhancers': 'Flavors & Colors',
  'Color Additives': 'Flavors & Colors',
  'Dairy': 'Dairy & Eggs',
  'Eggs': 'Dairy & Eggs',
  'Produce': 'Whole Foods',
  'Proteins': 'Whole Foods',
  'Legumes': 'Whole Foods',
  'Spices/Herbs': 'Whole Foods',
  'Whole Foods': 'Whole Foods',
  'Descriptive Term': 'Other',
  'Snacks/Confectionery': 'Other',
  'Other': 'Other'
};

export const CATEGORIES = [
  'Whole Foods',
  'Grains & Starches',
  'Dairy & Eggs',
  'Sweeteners',
  'Oils & Fats',
  'Flavors & Colors',
  'Vitamins & Nutrients',
  'Preservatives & Stability',
  'Texture & Consistency',
  'Other'
];

export const getDisplayCategory = (rawCategory: string): string => {
  return CATEGORY_MAPPING[rawCategory] || 'Other';
};

export const INGREDIENTS: Ingredient[] = [
  {
    id: 'citric-acid',
    name: 'Citric Acid',
    synonyms: ['E330', 'Citrate'],
    category: 'Preservatives & Stability',
    score: 7,
    scoreReasoning: 'Citric acid is a naturally occurring organic acid found in citrus fruits. While generally recognized as safe (GRAS), most commercial citric acid is produced via fermentation of Aspergillus niger. It is widely used as a preservative and acidity regulator. Some individuals may experience sensitivity, and excessive consumption of acidic foods can affect dental health.',
    summaryShort: 'A common organic acid used as a preservative and flavor enhancer.',
    positives: ['Natural preservative', 'Antioxidant properties', 'Enhances flavor'],
    negatives: ['Can contribute to tooth enamel erosion', 'Some individuals may have sensitivities', 'Often industrially produced from mold fermentation'],
    evidenceOverview: 'Extensively studied and regulated by the FDA and EFSA. It is a key intermediate in the Krebs cycle, a fundamental metabolic process in all aerobic organisms.',
    confidenceLevel: 'High',
    evidenceType: 'Regulatory',
    studies: [],
    lastReviewed: '2024-03-19',
    status: 'Likely Neutral',
    studyQualitySummary: 'High quality regulatory reviews and metabolic studies.',
    regulatoryWeight: 0.3,
    regulatoryConsensus: 'GRAS (Generally Recognized as Safe)',
    evidenceStrength: 'Strong',
    humanEvidence: 'High',
    evolvingEvidence: false,
    lastScientificRefresh: '2024-03-19'
  },
  {
    id: 'sugar',
    name: 'Sugar',
    synonyms: ['Sucrose', 'Cane Sugar', 'Beet Sugar'],
    category: 'Sweeteners',
    score: 3,
    scoreReasoning: 'Excessive sugar consumption is strongly linked to obesity, type 2 diabetes, and cardiovascular disease. It provides empty calories and can lead to tooth decay.',
    summaryShort: 'A simple carbohydrate used as a sweetener.',
    positives: ['Quick energy source'],
    negatives: ['High glycemic index', 'Linked to chronic diseases', 'Addictive potential'],
    evidenceOverview: 'Decades of clinical research and epidemiological studies consistently show the negative health impacts of high added sugar intake.',
    confidenceLevel: 'High',
    evidenceType: 'Systematic Review',
    studies: [],
    lastReviewed: '2024-03-19',
    status: 'Potential Concern',
    studyQualitySummary: 'Extensive high-quality human evidence.',
    regulatoryWeight: 0.4,
    regulatoryConsensus: 'Recommended to limit intake',
    evidenceStrength: 'Strong',
    humanEvidence: 'High',
    evolvingEvidence: false,
    lastScientificRefresh: '2024-03-19'
  },
  {
    id: 'salt',
    name: 'Salt',
    synonyms: ['Sodium Chloride', 'Sea Salt', 'Table Salt'],
    category: 'Other',
    score: 5,
    scoreReasoning: 'Essential for life but often consumed in excess in modern diets. High sodium intake is a major risk factor for hypertension and heart disease.',
    summaryShort: 'An essential mineral used for seasoning and preservation.',
    positives: ['Essential electrolyte', 'Natural preservative'],
    negatives: ['Linked to high blood pressure', 'Fluid retention'],
    evidenceOverview: 'Strong evidence links high sodium intake to increased blood pressure and cardiovascular risk.',
    confidenceLevel: 'High',
    evidenceType: 'Meta-analysis',
    studies: [],
    lastReviewed: '2024-03-19',
    status: 'Mixed Evidence',
    studyQualitySummary: 'Robust clinical and observational data.',
    regulatoryWeight: 0.3,
    regulatoryConsensus: 'Recommended to limit intake',
    evidenceStrength: 'Strong',
    humanEvidence: 'High',
    evolvingEvidence: false,
    lastScientificRefresh: '2024-03-19'
  },
  {
    id: 'maltodextrin',
    name: 'Maltodextrin',
    synonyms: ['Malto-dextrin', 'Multodextrin', 'Multo-dextrin', 'Corn Syrup Solids'],
    category: 'Grains & Starches',
    score: 4,
    scoreReasoning: 'Maltodextrin is a highly processed carbohydrate derived from starch (usually corn, rice, or potato). It has a very high glycemic index (higher than table sugar), meaning it can cause rapid spikes in blood glucose levels. While safe in small amounts for most people, it provides empty calories and can be problematic for those with diabetes or insulin resistance.',
    summaryShort: 'A highly processed starch with a high glycemic index.',
    positives: ['Quick energy source', 'Improves texture in processed foods'],
    negatives: ['Very high glycemic index', 'Can spike blood sugar', 'Highly processed'],
    evidenceOverview: 'Extensively used in the food industry. Clinical studies focus on its glycemic response and impact on gut microbiota in some individuals.',
    confidenceLevel: 'High',
    evidenceType: 'Regulatory',
    studies: [],
    lastReviewed: '2024-03-22',
    status: 'Potential Concern',
    studyQualitySummary: 'High quality metabolic and regulatory data.',
    regulatoryWeight: 0.3,
    regulatoryConsensus: 'GRAS (Generally Recognized as Safe)',
    evidenceStrength: 'Strong',
    humanEvidence: 'High',
    evolvingEvidence: false,
    lastScientificRefresh: '2024-03-22'
  },
  {
    id: 'soluble-corn-fiber',
    name: 'Soluble Corn Fiber',
    synonyms: ['Maltodextrin (Fiber)', 'Resistant Maltodextrin', 'Corn Fiber'],
    category: 'Vitamins & Nutrients',
    score: 8,
    scoreReasoning: 'Soluble corn fiber (also known as resistant maltodextrin) is a prebiotic fiber that is resistant to digestion in the small intestine. Unlike regular maltodextrin, it has a very low glycemic index and helps promote the growth of beneficial gut bacteria. It is often used to add fiber to foods without significantly affecting taste or texture.',
    summaryShort: 'A prebiotic fiber that supports gut health and has a low glycemic impact.',
    positives: ['Prebiotic effect', 'Low glycemic index', 'Supports digestive health', 'Increases calcium absorption'],
    negatives: ['Can cause gas or bloating in high amounts', 'Highly processed'],
    evidenceOverview: 'Numerous clinical trials demonstrate its prebiotic benefits and minimal impact on blood glucose levels.',
    confidenceLevel: 'High',
    evidenceType: 'RCT',
    studies: [],
    lastReviewed: '2024-03-22',
    status: 'Likely Beneficial',
    studyQualitySummary: 'Multiple randomized controlled trials support its health benefits.',
    regulatoryWeight: 0.2,
    regulatoryConsensus: 'Recognized as a dietary fiber by the FDA',
    evidenceStrength: 'Strong',
    humanEvidence: 'High',
    evolvingEvidence: false,
    lastScientificRefresh: '2024-03-22'
  }
];
