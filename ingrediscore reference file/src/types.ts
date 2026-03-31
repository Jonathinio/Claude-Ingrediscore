import { type Ingredient } from './data/ingredients';

export type ProcessingLevel = 'Minimally Processed' | 'Moderately Processed' | 'Highly Processed' | 'Ultra-Processed';

export type MatchType = 'exact' | 'alias' | 'unrecognized' | 'resolved-parent' | 'term';

export interface MatchedIngredient extends Ingredient {
  originalName: string;
  isMatched: boolean;
  matchType: MatchType;
  mappingReasoning?: string;
  isCompound?: boolean;
  subIngredients?: MatchedIngredient[];
  parentLabelType?: 'Compound Ingredient' | 'Functional Group Label' | 'Ingredient Group' | 'Resolved Parent Label';
  resolutionStatus?: 'Resolved via sub-ingredients' | 'Unresolved';
}

export interface ProductAnalysis {
  overallScore: number;
  processingLevel: ProcessingLevel;
  summary: string;
  loweredScoreBy: string[];
  improvedScoreBy: string[];
  keyConcerns: string[];
  positiveAttributes: string[];
  scoreExplanation: string;
  ingredients: MatchedIngredient[];
  confidenceLevel?: 'Low' | 'Moderate' | 'High';
  evidenceBasis?: string;
}

export interface Product {
  barcode: string;
  name: string;
  brand: string;
  ingredientsRaw: string;
  ingredientsParsed: string[];
  score: number;
  summary: string;
  status: 'confirmed' | 'needs-review';
  frontImage?: string | null;
  nutritionImage?: string | null;
  ingredientsImage?: string | null;
  analysis?: ProductAnalysis;
  scannedAt: number;
  updatedAt: number;
  createdBy?: string;
}
