import Foundation

struct ProductAnalysis: Codable, Hashable, Sendable {
    let overallScore: Int
    let summary: String
    let scoreExplanation: String
    let confidenceLevel: ConfidenceLevel
    let evidenceBasis: String
    let keyConcerns: [String]
    let positiveAttributes: [String]
    let loweredScoreBy: [String]
    let improvedScoreBy: [String]
    let processingLevel: ProcessingLevel
    let ingredients: [IngredientMatch]
    let scoreVersion: ScoringVersion
}
