import Foundation

struct Ingredient: Identifiable, Codable, Hashable {
    let id: String
    let canonicalName: String
    let aliases: [String]
    let category: IngredientCategory
    let score: Int
    let scoreReasoning: String
    let summaryShort: String
    let positives: [String]
    let negatives: [String]
    let evidenceOverview: String
    let confidenceLevel: ConfidenceLevel
    let evidenceType: EvidenceType
    let studies: [EvidenceStudy]
}
