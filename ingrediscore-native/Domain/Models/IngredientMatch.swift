import Foundation

struct IngredientMatch: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let originalName: String
    let displayName: String
    let matchType: MatchType
    let confidence: ConfidenceLevel
    let ingredient: Ingredient?
    let subIngredients: [IngredientMatch]
}
