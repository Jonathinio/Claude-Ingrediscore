import { saveProduct, saveIngredientMapping, getAllIngredientMappings } from './productService';
import { type Product } from '../types';
import { INGREDIENTS, getIngredientMap, cleanIngredientName } from './ingredientService';
import { generateHolisticAnalysisWithAI, matchIngredientsWithAI } from './geminiService';
import { type MatchedIngredient, type ProductAnalysis, type ProcessingLevel } from '../types';
import { addLog } from './logger';

const NON_INGREDIENT_TERMS = [
  'ingredients', 'contains', 'and', 'or', 'less than 2%', 'natural flavors', 
  'artificial flavors', 'spices', 'vitamins and minerals', 'enriched flour',
  'bleached flour', 'wheat flour', 'malted barley flour', 'niacin', 'reduced iron',
  'thiamine mononitrate', 'riboflavin', 'folic acid',
  'thickener', 'emulsifier', 'stabilizer', 'gelling agent', 'preservative', 
  'color', 'flavor', 'antioxidant', 'acidity regulator', 'firming agent',
  'humectant', 'raising agent', 'flour treatment agent', 'glazing agent',
  'bulking agent', 'sweetener', 'flavor enhancer', 'sequestrant'
];

export const findBestMatch = async (name: string, mappingDict: Record<string, string> = {}, isSubCall: boolean = false): Promise<MatchedIngredient | null> => {
  if (typeof name !== 'string') return null;
  
  const lower = name.toLowerCase().trim();
  const cleaned = cleanIngredientName(lower);
  
  // 0. Handle "AND/OR", "OR", "AND", or "&" combined ingredients
  if (lower.includes(' and/or ') || lower.includes(' or ') || lower.includes(' and ') || lower.includes(' & ')) {
    const parts = lower.split(/\s+and\/or\s+|\s+or\s+|\s+and\s+|\s+&\s+/);
    for (const part of parts) {
      const match = await findBestMatch(part, mappingDict, isSubCall);
      if (match && match.matchType !== 'unrecognized') {
        return { ...match, originalName: name };
      }
    }
  }

  // 0.5 Handle parentheses A (B) where B might be the actual ingredient or vice versa
  if (!isSubCall) {
    const parenMatch = lower.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (parenMatch) {
      const A = parenMatch[1].trim();
      const B = parenMatch[2].trim();
      
      // Don't handle lists here, reAnalyzeProduct does that
      if (!B.includes(',') && !B.includes(';')) {
        const matchA = await findBestMatch(A, mappingDict, true);
        const matchB = await findBestMatch(B, mappingDict, true);
        
        // If both match, prefer the one that isn't a generic "Term"
        const isRealA = matchA && matchA.category !== 'Term' && matchA.matchType !== 'unrecognized';
        const isRealB = matchB && matchB.category !== 'Term' && matchB.matchType !== 'unrecognized';
        
        if (isRealB && !isRealA) return { ...matchB, originalName: name };
        if (isRealA) return { ...matchA, originalName: name };
        if (matchB) return { ...matchB, originalName: name };
        if (matchA) return { ...matchA, originalName: name };
      }
    }
  }

  const ingredientMap = getIngredientMap();

  // 1. Exact match
  const exact = ingredientMap.get(lower) || ingredientMap.get(cleaned);
  if (exact) return { ...exact, originalName: name, isMatched: true, matchType: 'exact' };

  // 2. Check if it's a non-ingredient term
  const isTerm = NON_INGREDIENT_TERMS.some(term => lower === term || lower.includes(`(${term})`));
  if (isTerm) {
    return {
      id: `term-${lower.replace(/\s+/g, '-')}`,
      name: name,
      originalName: name,
      synonyms: [],
      category: 'Term',
      score: 7,
      scoreReasoning: 'This is a descriptive term or category, not a specific ingredient.',
      summaryShort: 'Descriptive term.',
      positives: [],
      negatives: [],
      evidenceOverview: 'N/A',
      confidenceLevel: 'High',
      evidenceType: 'Mixed',
      studies: [],
      lastReviewed: 'N/A',
      status: 'Likely Neutral',
      studyQualitySummary: 'N/A',
      regulatoryWeight: 0,
      regulatoryConsensus: 'Term',
      evidenceStrength: 'High',
      humanEvidence: 'High',
      evolvingEvidence: false,
      lastScientificRefresh: 'N/A',
      isMatched: true,
      matchType: 'term'
    } as any;
  }

  // 3. Flexible match (e.g. "Sucrose" matching "Sugar (Sucrose)")
  const flexible = INGREDIENTS.find(ing => {
    if (!ing || typeof ing.name !== 'string') return false;
    const ingNameLower = ing.name.toLowerCase();
    const ingNameCleaned = cleanIngredientName(ingNameLower);
    
    if (ingNameLower.includes(`(${lower})`) || ingNameLower.includes(`(${cleaned})`)) return true;
    if (ingNameLower.startsWith(`${lower} (`) || ingNameLower.startsWith(`${cleaned} (`)) return true;
    if (ingNameCleaned === cleaned && cleaned.length > 2) return true;
    if (cleaned.length > 3 && (ingNameCleaned.includes(cleaned) || cleaned.includes(ingNameCleaned))) {
      const words1 = cleaned.split(' ');
      const words2 = ingNameCleaned.split(' ');
      const intersection = words1.filter(w => words2.includes(w));
      if (intersection.length > 0 && (words1.length === 1 || words2.length === 1)) return true;
    }
    return false;
  });
  if (flexible) return { ...flexible, originalName: name, isMatched: true, matchType: 'alias' };

  // 4. Mapping match
  const lowerTrimmed = lower.trim();
  const cleanedTrimmed = cleaned.trim();
  
  const allMappings = await getAllIngredientMappings();
  const mapping = allMappings.find(m => m.originalName.toLowerCase() === lowerTrimmed || m.originalName.toLowerCase() === cleanedTrimmed);
  
  if (mapping) {
    const mapped = INGREDIENTS.find(ing => ing && ing.id === mapping.mappedId);
    if (mapped) return { ...mapped, originalName: name, isMatched: true, matchType: 'alias', mappingReasoning: mapping.reasoning };
  }

  return null;
};

export const calculateOverallScore = (ingredients: MatchedIngredient[]): number => {
  let weightedSum = 0;
  let totalWeight = 0;
  
  ingredients.forEach((ing, index) => {
    let weight = 1;
    if (index === 0) weight = 5;
    else if (index === 1) weight = 3;
    else if (index === 2) weight = 2;
    
    let scoreToUse = ing.score;
    if (ing.isCompound && ing.subIngredients && ing.subIngredients.length > 0) {
      // If it's a compound ingredient, we should consider the sub-ingredients
      // especially if the parent is just a grouping label or a generic term
      if (ing.matchType === 'unrecognized' || ing.matchType === 'resolved-parent' || ing.matchType === 'term') {
        const subScores = ing.subIngredients.map(s => s.score);
        scoreToUse = subScores.reduce((a, b) => a + b, 0) / subScores.length;
      }
    }
    
    weightedSum += scoreToUse * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 5;
};

export const getProcessingLevel = (score: number): ProcessingLevel => {
  if (score >= 8) return 'Minimally Processed';
  if (score >= 5) return 'Moderately Processed';
  return 'Ultra-Processed';
};

export const calculateHolisticScore = (matchedIngredients: MatchedIngredient[]): { 
  finalScore: number, 
  processingLevel: ProcessingLevel,
  keyConcerns: string[],
  positiveAttributes: string[]
} => {
  // 1. Calculate weighted score based on order and individual scores
  const baseScore = calculateOverallScore(matchedIngredients);
  
  // 2. Penalties and Bonuses
  let finalScore = baseScore;
  const keyConcerns: string[] = [];
  const positiveAttributes: string[] = [];
  
  const allIngredientsForCategories = [...matchedIngredients].filter(Boolean);
  matchedIngredients.filter(Boolean).forEach(ing => {
    if (ing.isCompound && ing.subIngredients) {
      allIngredientsForCategories.push(...ing.subIngredients.filter(Boolean));
    }
  });

  const categories = allIngredientsForCategories
    .map(i => i?.category)
    .filter((c): c is string => typeof c === 'string');

  const hasSweeteners = categories.some(c => c.includes('Sweeteners'));
  const hasColors = categories.some(c => c.includes('Colors'));
  const hasPreservatives = categories.some(c => c.includes('Preservatives'));
  const hasEmulsifiers = categories.some(c => c.includes('Emulsifiers') || c.includes('Gums'));
  
  if (hasSweeteners) { finalScore -= 1; keyConcerns.push('Contains sweeteners'); }
  if (hasColors) { finalScore -= 1; keyConcerns.push('Contains artificial colors/dyes'); }
  if (hasPreservatives) { finalScore -= 0.5; keyConcerns.push('Contains preservatives'); }
  if (hasEmulsifiers) { finalScore -= 0.5; keyConcerns.push('Contains emulsifiers or stabilizers'); }
  
  const finalScoreRounded = Math.max(1, Math.min(10, Math.round(finalScore)));
  const processingLevel = getProcessingLevel(finalScoreRounded);

  return {
    finalScore: finalScoreRounded,
    processingLevel,
    keyConcerns,
    positiveAttributes
  };
};

export const performHolisticAnalysis = async (
  productName: string, 
  productBrand: string, 
  matchedIngredients: MatchedIngredient[],
  skipAI: boolean = false,
  existingAnalysis?: ProductAnalysis
): Promise<ProductAnalysis> => {
  const { finalScore: finalScoreRounded, processingLevel, keyConcerns, positiveAttributes } = calculateHolisticScore(matchedIngredients);
  
  const sortedByScore = [...matchedIngredients].sort((a, b) => a.score - b.score);
  const loweredScoreBy = sortedByScore.slice(0, 3).filter(i => i.score < 5).map(i => i.name);
  const improvedScoreBy = [...sortedByScore].reverse().slice(0, 3).filter(i => i.score > 7).map(i => i.name);
  
  let summary = existingAnalysis?.summary || `This product has an overall score of ${finalScoreRounded}/10 and is considered to have a ${processingLevel.toLowerCase()} level of processing.`;
  let explanation = existingAnalysis?.scoreExplanation || `The score is calculated based on individual ingredient quality, with higher weight given to primary ingredients.`;
  let aiKeyConcerns = existingAnalysis?.keyConcerns || keyConcerns;
  let aiPositiveAttributes = existingAnalysis?.positiveAttributes || positiveAttributes;
  let confidenceLevel: 'Low' | 'Moderate' | 'High' = existingAnalysis?.confidenceLevel || 'Moderate';
  let evidenceBasis = existingAnalysis?.evidenceBasis || "Analysis based on ingredient database profiles.";

  if (!skipAI) {
    try {
      const aiAnalysis = await generateHolisticAnalysisWithAI(productName, productBrand, matchedIngredients);
      if (aiAnalysis.summary && aiAnalysis.scoreExplanation) {
        summary = aiAnalysis.summary;
        explanation = aiAnalysis.scoreExplanation;
        confidenceLevel = aiAnalysis.confidenceLevel;
        evidenceBasis = aiAnalysis.evidenceBasis;
        
        // Merge AI insights with local basic ones if they exist
        if (aiAnalysis.keyConcerns && aiAnalysis.keyConcerns.length > 0) {
          aiKeyConcerns = Array.from(new Set([...keyConcerns, ...aiAnalysis.keyConcerns]));
        }
        if (aiAnalysis.positiveAttributes && aiAnalysis.positiveAttributes.length > 0) {
          aiPositiveAttributes = Array.from(new Set([...positiveAttributes, ...aiAnalysis.positiveAttributes]));
        }
      }
    } catch (err) {
      console.warn("AI holistic analysis failed, using local fallback:", err);
    }
  }

  return {
    overallScore: finalScoreRounded,
    processingLevel,
    summary,
    loweredScoreBy,
    improvedScoreBy,
    keyConcerns: aiKeyConcerns,
    positiveAttributes: aiPositiveAttributes,
    scoreExplanation: explanation,
    ingredients: matchedIngredients,
    confidenceLevel,
    evidenceBasis
  };
};

const refreshMatchedIngredient = async (ing: MatchedIngredient, mappingDict: Record<string, string>): Promise<MatchedIngredient> => {
  // 1. Try to find a match for the original name or the current name
  // We prefer the original name if it was a simple ingredient, 
  // but for compound ingredients, the original name might be "Parent (Sub, Sub)"
  // which findBestMatch won't handle well as a single unit.
  
  let match: MatchedIngredient | null = null;
  
  if (!ing.isCompound) {
    match = await findBestMatch(ing.originalName || ing.name, mappingDict);
  } else {
    // For compound ingredients, we want to refresh the parent and the children separately
    // Try to match the parent name (which is usually ing.name)
    match = await findBestMatch(ing.name, mappingDict);
    
    if (!match) {
      // If parent isn't in DB, keep the existing parent info but mark as compound
      match = { ...ing };
    }
    
    match.isCompound = true;
    match.subIngredients = [];
    if (ing.subIngredients) {
      for (const sub of ing.subIngredients) {
        const refreshedSub = await refreshMatchedIngredient(sub, mappingDict);
        match.subIngredients.push(refreshedSub);
      }
    }
    
    // Ensure originalName is preserved
    match.originalName = ing.originalName;
  }
  
  if (match) return match;
  
  // Fallback: if no match found, return the original but maybe it's unrecognized
  return ing;
};

const createUnknownIngredient = (name: string, originalName: string): MatchedIngredient => ({
  id: `unknown-${name.replace(/\s+/g, '-').toLowerCase()}`,
  name: name,
  originalName: originalName,
  synonyms: [],
  category: 'Unknown',
  score: 5,
  scoreReasoning: 'Ingredient not in database.',
  summaryShort: 'Information not available.',
  positives: [],
  negatives: [],
  evidenceOverview: 'No clinical data found.',
  confidenceLevel: 'Low',
  evidenceType: 'Mixed',
  studies: [],
  lastReviewed: 'N/A',
  status: 'Likely Neutral',
  studyQualitySummary: 'N/A',
  regulatoryWeight: 0,
  regulatoryConsensus: 'Unknown',
  evidenceStrength: 'Low',
  humanEvidence: 'Low',
  evolvingEvidence: false,
  lastScientificRefresh: 'N/A',
  isMatched: false,
  matchType: 'unrecognized'
});

export const reAnalyzeProduct = async (product: Product, skipAI: boolean = false): Promise<Product> => {
  addLog(`Re-analyzing product: ${product.name} (skipAI: ${skipAI})`);
  
  // Load mappings for better matching
  const allMappings = await getAllIngredientMappings();
  const mappingDict: Record<string, string> = {};
  allMappings.forEach(m => {
    mappingDict[m.originalName] = m.mappedId;
  });

  const matched: MatchedIngredient[] = [];

  if (product.analysis?.ingredients && product.analysis.ingredients.length > 0) {
    // Use existing structure to preserve compound ingredients (sub-categories)
    for (const ing of product.analysis.ingredients) {
      const refreshed = await refreshMatchedIngredient(ing, mappingDict);
      matched.push(refreshed);
    }
  } else {
    // Fallback to ingredientsParsed if analysis is missing
    const ingredientsToMatch = product.ingredientsParsed || [];
    for (const rawName of ingredientsToMatch) {
      // Check if it looks like a compound ingredient: "Parent (Sub1, Sub2)"
      // Only split if it contains commas or semicolons inside parentheses, 
      // or if it's a known parent label type.
      const parenMatch = rawName.match(/^([^(]+)\s*\(([^)]+)\)$/);
      const subText = parenMatch ? parenMatch[2] : '';
      const isLikelyList = subText.includes(',') || subText.includes(';') || subText.split(' ').length > 3;
      
      const parentLabelTerms = [
        'leavening', 'seasoning', 'spice blend', 'filling', 'frosting', 'coating', 
        'sauce', 'broth', 'marinade', 'breading', 'semisweet chocolate', 
        'lemonade', 'fruit blend', 'vegetable blend'
      ];
      const isKnownParent = parenMatch && parentLabelTerms.some(term => parenMatch[1].toLowerCase().includes(term));

      if (parenMatch && (isLikelyList || isKnownParent)) {
        const outerName = parenMatch[1].trim();
        const subNames = subText.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        
        let match = await findBestMatch(outerName, mappingDict);
        if (!match) {
          match = createUnknownIngredient(outerName, outerName);
        }
        
        match!.isCompound = true;
        match!.subIngredients = [];
        for (const subName of subNames) {
          const subMatch = await findBestMatch(subName, mappingDict);
          if (subMatch) {
            match!.subIngredients.push(subMatch);
          } else {
            match!.subIngredients.push(createUnknownIngredient(subName, subName));
          }
        }
        matched.push(match!);
      } else {
        // Simple ingredient or synonym/description in parentheses
        const match = await findBestMatch(rawName, mappingDict);
        if (match) {
          matched.push({ ...match, originalName: rawName });
        } else {
          matched.push(createUnknownIngredient(rawName, rawName));
        }
      }
    }
  }

  const newAnalysis = await performHolisticAnalysis(product.name, product.brand, matched, skipAI, product.analysis);
  
  const updatedProduct: Product = {
    ...product,
    score: newAnalysis.overallScore,
    summary: newAnalysis.summary,
    analysis: newAnalysis,
  };

  await saveProduct(updatedProduct);
  return updatedProduct;
};
