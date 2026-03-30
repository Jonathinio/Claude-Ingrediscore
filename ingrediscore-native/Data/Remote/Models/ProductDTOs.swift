import Foundation

struct ProductDTO: Codable {
    let id: String
    let barcode: String?
    let name: String
    let brand: String?
    let rawIngredientText: String?
    let analysis: ProductAnalysisDTO?
}

struct ProductAnalysisDTO: Codable {
    let overallScore: Int
    let summary: String
    let scoreExplanation: String
    let confidenceLevel: String
    let evidenceBasis: String
    let keyConcerns: [String]
    let positiveAttributes: [String]
    let loweredScoreBy: [String]
    let improvedScoreBy: [String]
    let processingLevel: String
    let ingredients: [IngredientMatchDTO]
    let scoreVersion: ScoringVersionDTO
}

struct IngredientDTO: Codable {
    let id: String
    let canonicalName: String
    let aliases: [String]
    let category: String
    let score: Int
    let scoreReasoning: String
    let summaryShort: String
    let positives: [String]
    let negatives: [String]
    let evidenceOverview: String
    let confidenceLevel: String
    let evidenceType: String
    let studies: [EvidenceStudyDTO]
}

struct IngredientMatchDTO: Codable {
    let id: String
    let originalName: String
    let displayName: String
    let matchType: String
    let confidence: String
    let ingredient: IngredientDTO?
    let subIngredients: [IngredientMatchDTO]
}

struct EvidenceStudyDTO: Codable {
    let id: String
    let title: String
    let authors: String?
    let journal: String?
    let year: Int?
    let type: String
    let quality: String
    let populationType: String
    let sampleSize: String?
    let duration: String?
    let keyFindings: String
    let limitations: String
    let url: String?
    let pmid: String?
}

struct ScoringVersionDTO: Codable {
    let id: String
    let parserVersion: String
    let ingredientModelVersion: String
    let scoringRulesVersion: String
    let rationaleVersion: String
}
